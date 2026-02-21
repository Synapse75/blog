// js/md-loader.js — 加载本地 Markdown 文章（纯静态，无后端）
var localPosts = []
var allCategories = []

// 从 posts/index.json 加载文章索引
async function loadLocalPosts() {
  try {
    const res = await fetch('posts/index.json?t=' + Date.now())
    if (!res.ok) {
      console.warn('未找到 posts/index.json，请运行 node build.js')
      return
    }
    const index = await res.json()

    localPosts = index.map(item => ({
      id: `${item.date}/${item.slug}`,
      title: item.title,
      date: item.date,
      slug: item.slug,
      content: item.excerpt || '',
      excerpt: item.excerpt || '',
      category: item.category || '',
      tags: (item.tags || []).map(name => ({ name, id: 'tag:' + name })),
      file: item.file,
      created_at: item.created_at,
      updated_at: item.updated_at,
      _contentLoaded: false
    }))

    // 提取所有分类
    const catSet = new Set()
    localPosts.forEach(p => { if (p.category) catSet.add(p.category) })
    allCategories = [...catSet].sort()
  } catch (e) {
    console.warn('加载本地文章索引失败:', e)
  }
}

// 按需加载单篇 MD 文章的完整内容
async function loadLocalPostContent(post) {
  if (post._contentLoaded) return post

  try {
    const res = await fetch('posts/' + post.file + '?t=' + Date.now())
    if (!res.ok) throw new Error('Fetch failed')
    const raw = await res.text()

    // 移除 front matter
    const bodyMatch = raw.match(/^---[\s\S]*?---\s*(.*)$/s)
    const body = bodyMatch ? bodyMatch[1].trim() : raw

    // 移除标题行（已在页面标题显示，避免重复）
    post.content = body.replace(/^#{1,2}\s+.+\r?\n+/, '').trim()
    post._contentLoaded = true
  } catch (e) {
    console.error('加载文章内容失败:', post.file, e)
  }
  return post
}

// 获取文章的完整 URL hash
function getPostHash(post) {
  return `#/post/${post.date}/${post.slug}`
}

// 通过 date + slug 查找文章
function findPostByDateSlug(date, slug) {
  return localPosts.find(p => p.date === date && p.slug === slug) || null
}
