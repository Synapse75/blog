// js/router.js — Hash 路由
// #/                        → 文章列表
// #/post/YYYY-MM-DD/slug    → 文章详情
// #/tags                    → 标签页
// #/tag/标签名              → 按标签筛选
// #/categories              → 分类页
// #/category/分类名         → 按分类筛选
// #/about                   → 关于

function navigateTo(hash) {
  if (window.location.hash === hash) {
    handleRoute()
  } else {
    window.location.hash = hash
  }
}

async function handleRoute() {
  const hash = window.location.hash || '#/'

  // 关闭详情页
  const detailPage = document.getElementById('postDetailPage')
  if (detailPage) detailPage.classList.remove('active')

  // #/post/YYYY-MM-DD/slug
  const postMatch = hash.match(/^#\/post\/(\d{4}-\d{2}-\d{2})\/(.+)$/)
  if (postMatch) {
    const post = findPostByDateSlug(postMatch[1], decodeURIComponent(postMatch[2]))
    if (post) {
      if (!post._contentLoaded) await loadLocalPostContent(post)
      showPostDetail(post)
    } else {
      navigateTo('#/')
    }
    return
  }

  // #/tag/名称
  const tagMatch = hash.match(/^#\/tag\/(.+)$/)
  if (tagMatch) {
    selectedTagId = decodeURIComponent(tagMatch[1])
    selectedCategory = null
    switchTab('posts')
    return
  }

  // #/category/名称
  const catMatch = hash.match(/^#\/category\/(.+)$/)
  if (catMatch) {
    selectedCategory = decodeURIComponent(catMatch[1])
    selectedTagId = null
    switchTab('posts')
    return
  }

  // 简单路由
  const simple = hash.match(/^#\/(\w*)$/)
  const route = simple ? simple[1] : ''

  selectedTagId = null
  selectedCategory = null

  switch (route) {
    case 'tags':
      switchTab('tags')
      break
    case 'categories':
      switchTab('categories')
      break
    case 'about':
      switchTab('about')
      break
    default:
      switchTab('posts')
      break
  }
}

window.addEventListener('hashchange', handleRoute)
