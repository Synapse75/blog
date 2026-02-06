let selectedTagId = null

// ========== 左侧栏：最近更新的文章 ==========
function renderRecentSidebar() {
  const recentList = document.getElementById('recentList')
  if (!recentList) return
  recentList.innerHTML = ''

  // 按更新时间排序（最近更新在上）
  const sorted = [...posts].sort((a, b) =>
    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  )

  sorted.forEach(post => {
    const btn = document.createElement('button')
    btn.className = 'recent-item' + (post.id === currentId ? ' active' : '')

    const title = document.createElement('span')
    title.textContent = post.title || '（无标题）'

    const time = document.createElement('span')
    time.className = 'recent-item-time'
    time.textContent = formatDate(post.updated_at || post.created_at)

    btn.appendChild(title)
    btn.appendChild(time)
    btn.onclick = () => {
      currentId = post.id
      renderRecentSidebar()
      // 在右侧显示这篇文章（如果在编辑页则打开编辑）
      const editorPage = document.getElementById('editorPage')
      if (editorPage && !editorPage.classList.contains('hidden')) {
        openEditorPage(post.id)
      }
    }
    recentList.appendChild(btn)
  })
}

// ========== 右侧：文章卡片列表 ==========

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
    
      // 点击卡片显示详情
      card.onclick = (e) => {
        // 如果点击的是编辑按钮，不触发详情页
        if (e.target.tagName === 'BUTTON') return
        showPostDetail(post.id)
      }
    
    const header = document.createElement('div')
    header.className = 'post-card-header'
    
    const title = document.createElement('h3')
    title.className = 'post-card-title'
    title.textContent = post.title || '（无标题）'
    
    const time = document.createElement('span')
    time.className = 'post-card-time'
    time.textContent = formatDate(post.updated_at || post.created_at)
    
    header.appendChild(title)
    header.appendChild(time)
    card.appendChild(header)
    
    const content = document.createElement('p')
    content.className = 'post-card-content'
    content.textContent = post.content || '（无内容）'
    card.appendChild(content)
    
    // 显示标签
    if (post.tags && post.tags.length > 0) {
      const tagsContainer = document.createElement('div')
      tagsContainer.className = 'post-card-tags'
      post.tags.forEach(tag => {
        const tagEl = document.createElement('span')
        tagEl.className = 'post-card-tag'
        tagEl.textContent = tag.name
        tagsContainer.appendChild(tagEl)
      })
      card.appendChild(tagsContainer)
    }
    
    const footer = document.createElement('div')
    footer.className = 'post-card-footer'
    
    if (isLoggedIn) {
      const editBtn = document.createElement('button')
      editBtn.textContent = '编辑'
      editBtn.onclick = () => openEditorPage(post.id)
        editBtn.onclick = (e) => {
          e.stopPropagation()
          openEditorPage(post.id)
        }
      footer.appendChild(editBtn)
    }
    
    card.appendChild(footer)
    postsList.appendChild(card)
  })
}

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

async function openEditorPage(postId) {
  currentId = postId
  const post = posts.find(p => p.id === postId)
  
  if (!post) return
  
  document.getElementById('title').value = post.title || ''
  document.getElementById('content').value = post.content || ''
  
  await loadPostTags(postId)
  
  // 隐藏所有 tab 页面，显示编辑页
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'))
  document.getElementById('editorPage').classList.remove('hidden')
}

function closeEditorPage() {
  currentId = null
  currentPostTags = []
  document.getElementById('editorPage').classList.add('hidden')
  document.getElementById('postsArea').classList.remove('hidden')
  
  // 刷新文章列表
  displayPostsByTag()
}

function displayPostsByTag() {
  let postsToDisplay = [...posts]
  
  if (selectedTagId) {
    postsToDisplay = postsToDisplay.filter(post => 
      post.tags && post.tags.some(t => t.id === selectedTagId)
    )
  }
  
  // 文章 tab 默认按新建时间从新到旧排序
  postsToDisplay.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  )
  
  renderPostsList(postsToDisplay)
  renderRecentSidebar()
}

async function handleNewPost() {
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .insert({
      title: '新记录',
      content: '',
      author_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()  // 去掉 maybeSingle()

  if (error) {
    console.error('新建文章错误:', error)
    return alert(error.message)
  }

  if (!data || data.length === 0) {
    return alert('新建失败')
  }

  const newPost = {
    ...data[0],  // 手动取第一个
    tags: []
  }

  posts.unshift(newPost)
  currentId = newPost.id
  
  await openEditorPage(newPost.id)
}

async function handleSavePost() {
  if (!currentId) return
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .update({
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      updated_at: new Date().toISOString(),
      author_id: user.id  // 同时更新 author_id
    })
    .eq('id', currentId)
    .select()  // 移除 author_id 验证

  if (error) {
    console.error('保存文章错误:', error)
    return alert(error.message)
  }

  if (!data || data.length === 0) {
    return alert('保存失败：未找到文章')
  }

  const updatedPost = data[0]  // 手动取第一个结果

  // 保存标签关联
  await sb.from('post_tags').delete().eq('post_id', currentId)

  if (currentPostTags.length > 0) {
    const postTagsData = currentPostTags.map(tag => ({
      post_id: currentId,
      tag_id: tag.id
    }))
    
    const { error: tagError } = await sb
      .from('post_tags')
      .insert(postTagsData)
    
    if (tagError) {
      console.error('保存标签错误:', tagError)
      return alert(tagError.message)
    }

    // 更新标签使用次数
    for (const tag of currentPostTags) {
      await sb.rpc('increment_tag_usage', { tag_id: tag.id })
    }
  }

  // 重新加载这篇文章的完整信息（包括标签）
  const { data: fullPostData, error: fetchError } = await sb
    .from('posts')
    .select(`
      *,
      post_tags (
        tags (*)
      )
    `)
    .eq('id', currentId)
    .limit(1)  // 改用 limit(1)

  if (!fetchError && fullPostData && fullPostData.length > 0) {
    const fullPost = fullPostData[0]  // 手动取第一个
    // 转换格式
    const postWithTags = {
      ...fullPost,
      tags: (fullPost.post_tags || []).map(pt => pt.tags)
    }
    
    // 更新本地数组
    const idx = posts.findIndex(p => p.id === currentId)
    if (idx !== -1) {
      posts[idx] = postWithTags
    }
  }
  
  alert('保存成功')
  closeEditorPage()
}

// ========== 文章详情页 ==========
function showPostDetail(postId) {
  const post = posts.find(p => p.id === postId)
  if (!post) return
  
  const detailPage = document.getElementById('postDetailPage')
  
  // 构建元信息
  const metaItems = []
  
  // 作者（暂时显示为"作者"）
  metaItems.push(`<div class="post-detail-meta-item">✍️ 作者</div>`)
  
  // 更新时间
  const updateTime = new Date(post.updated_at || post.created_at).toLocaleString('zh-CN')
  metaItems.push(`<div class="post-detail-meta-item">🕒 ${updateTime}</div>`)
  
  // 分类（暂时不显示，未实现）
  
  // 标签
  let tagsHtml = ''
  if (post.tags && post.tags.length > 0) {
    tagsHtml = `
      <div class="post-detail-tags">
        ${post.tags.map(tag => `<span class="post-detail-tag">${tag.name}</span>`).join('')}
      </div>
    `
  }
  
  detailPage.innerHTML = `
    <button class="back-to-list-btn" onclick="backToPostsList()">← 返回列表</button>
    <div class="post-detail-header">
      <h1 class="post-detail-title">${post.title || '（无标题）'}</h1>
      <div class="post-detail-meta">
        ${metaItems.join('')}
      </div>
      ${tagsHtml}
    </div>
    <div class="post-detail-content">${post.content || '（无内容）'}</div>
  `
  
  // 隐藏所有 tab 页面，显示详情页
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'))
  document.getElementById('editorPage').classList.add('hidden')
  detailPage.classList.add('active')
}

function backToPostsList() {
  const detailPage = document.getElementById('postDetailPage')
  detailPage.classList.remove('active')
  document.getElementById('postsArea').classList.remove('hidden')
}