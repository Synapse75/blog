// js/posts.js — 文章列表、详情、分类（纯静态）
let selectedTagId = null
let selectedCategory = null

// ========== 左侧栏：最近更新的文章 ==========
function renderRecentSidebar() {
  const recentList = document.getElementById('recentList')
  if (!recentList) return
  recentList.innerHTML = ''

  const sorted = [...localPosts].sort((a, b) =>
    new Date(b.updated_at) - new Date(a.updated_at)
  )

  sorted.forEach(post => {
    const btn = document.createElement('button')
    btn.className = 'recent-item'

    const title = document.createElement('span')
    title.textContent = post.title || '（无标题）'

    const time = document.createElement('span')
    time.className = 'recent-item-time'
    time.textContent = formatDate(post.updated_at)

    btn.appendChild(title)
    btn.appendChild(time)
    btn.onclick = () => navigateTo(getPostHash(post))
    recentList.appendChild(btn)
  })
}

// ========== 文章卡片列表 ==========
function renderPostsList(postsToRender) {
  const postsList = document.getElementById('postsList')
  postsList.innerHTML = ''
  
  if (postsToRender.length === 0) {
    postsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无文章</p>'
    return
  }
  
  postsToRender.forEach(post => {
    const card = document.createElement('div')
    card.className = 'post-card'
    card.style.cursor = 'pointer'
    card.onclick = () => navigateTo(getPostHash(post))

    // 鼠标悬停时预加载文章内容
    card.onmouseenter = () => {
      if (!post._contentLoaded) loadLocalPostContent(post)
    }
    
    // 分类标签（位于标题上方，灰色小字）
    if (post.category) {
      const categoryLabel = document.createElement('div')
      categoryLabel.className = 'post-card-category'
      categoryLabel.textContent = post.category
      categoryLabel.style.cursor = 'pointer'
      categoryLabel.onclick = (e) => {
        e.stopPropagation()
        navigateTo('#/category/' + encodeURIComponent(post.category))
      }
      card.appendChild(categoryLabel)
    }
    
    const header = document.createElement('div')
    header.className = 'post-card-header'
    
    const title = document.createElement('h3')
    title.className = 'post-card-title'
    title.textContent = post.title || '（无标题）'
    
    const time = document.createElement('span')
    time.className = 'post-card-time'
    time.textContent = formatDate(post.updated_at)
    
    header.appendChild(title)
    header.appendChild(time)
    card.appendChild(header)
    
    const content = document.createElement('p')
    content.className = 'post-card-content'
    content.textContent = post.excerpt || ''
    card.appendChild(content)
    
    // 标签（不包含分类）
    if (post.tags && post.tags.length > 0) {
      const metaRow = document.createElement('div')
      metaRow.className = 'post-card-tags'
      
      post.tags.forEach(tag => {
        const tagEl = document.createElement('span')
        tagEl.className = 'post-card-tag'
        tagEl.textContent = tag.name
        tagEl.style.cursor = 'pointer'
        tagEl.onclick = (e) => {
          e.stopPropagation()
          navigateTo('#/tag/' + encodeURIComponent(tag.name))
        }
        metaRow.appendChild(tagEl)
      })
      
      card.appendChild(metaRow)
    }
    
    postsList.appendChild(card)
  })
}

// ========== 日期格式化 ==========
function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// ========== 显示文章列表（可按标签/分类筛选）==========
function displayPosts() {
  let postsToDisplay = [...localPosts]
  
  if (selectedCategory) {
    postsToDisplay = postsToDisplay.filter(p => p.category === selectedCategory)
  }
  
  if (selectedTagId) {
    postsToDisplay = postsToDisplay.filter(post => 
      post.tags && post.tags.some(t => t.name === selectedTagId)
    )
  }
  
  postsToDisplay.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  renderPostsList(postsToDisplay)
  renderRecentSidebar()
}

// ========== 文章详情页 ==========
function showPostDetail(post) {
  if (!post) return
  
  const detailPage = document.getElementById('postDetailPage')
  
  const metaItems = []
  
  // 分类
  if (post.category) {
    metaItems.push(`<div class="post-detail-meta-item post-detail-category">${escapeHtml(post.category)}</div>`)
  }
  
  // 标签
  let tagsHtml = ''
  if (post.tags && post.tags.length > 0) {
    tagsHtml = `
      <div class="post-detail-tags">
        ${post.tags.map(tag => `<span class="post-detail-tag">${escapeHtml(tag.name)}</span>`).join('')}
      </div>
    `
  }
  
  // Markdown 渲染
  let contentHtml = ''
  if (typeof marked !== 'undefined') {
    contentHtml = marked.parse(post.content || '')
  } else {
    contentHtml = escapeHtml(post.content || '').replace(/\n/g, '<br>')
  }
  // 为所有图片添加懒加载
  contentHtml = contentHtml.replace(/<img /g, '<img loading="lazy" ')
  
  detailPage.innerHTML = `
    <button class="back-to-list-btn" onclick="backToPostsList()">← 返回列表</button>
    <div class="post-detail-header">
      <h1 class="post-detail-title">${escapeHtml(post.title || '（无标题）')}</h1>
      <div class="post-detail-meta">
        ${metaItems.join('')}
      </div>
      ${tagsHtml}
    </div>
    <div class="post-detail-content markdown-body">${contentHtml}</div>
    <div class="interactions-section" data-post-id="${post.id}"></div>
  `
  
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'))
  detailPage.classList.add('active')

  // 加载互动区域（点赞 + 评论）
  const interSection = detailPage.querySelector('.interactions-section')
  renderInteractions(post.id, interSection)
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function backToPostsList() {
  navigateTo('#/')
}

// ========== 分类页面 ==========
function renderCategoriesPage() {
  const container = document.getElementById('categoriesPageList')
  if (!container) return
  container.innerHTML = ''

  if (allCategories.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无分类</p>'
    return
  }

  allCategories.forEach(cat => {
    const count = localPosts.filter(p => p.category === cat).length
    const el = document.createElement('div')
    el.className = 'tags-page-item'
    el.onclick = () => navigateTo('#/category/' + encodeURIComponent(cat))

    const name = document.createElement('span')
    name.className = 'tags-page-item-name'
    name.textContent = cat

    const countEl = document.createElement('span')
    countEl.className = 'tags-page-item-count'
    countEl.textContent = count + ' 篇文章'

    el.appendChild(name)
    el.appendChild(countEl)
    container.appendChild(el)
  })
}

// ========== 标签页面（纯本地）==========
function renderTagsPage() {
  const container = document.getElementById('tagsPageList')
  if (!container) return
  container.innerHTML = ''

  // 统计标签
  const tagMap = {}
  localPosts.forEach(post => {
    (post.tags || []).forEach(tag => {
      tagMap[tag.name] = (tagMap[tag.name] || 0) + 1
    })
  })

  const tagNames = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a])

  if (tagNames.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无标签</p>'
    return
  }

  tagNames.forEach(name => {
    const tagEl = document.createElement('div')
    tagEl.className = 'tags-page-item'
    tagEl.onclick = () => navigateTo('#/tag/' + encodeURIComponent(name))

    const nameEl = document.createElement('span')
    nameEl.className = 'tags-page-item-name'
    nameEl.textContent = name

    const count = document.createElement('span')
    count.className = 'tags-page-item-count'
    count.textContent = tagMap[name] + ' 篇文章'

    tagEl.appendChild(nameEl)
    tagEl.appendChild(count)
    container.appendChild(tagEl)
  })
}
