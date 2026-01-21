let selectedTagId = null

// 删除旧的 renderList 和 renderEditor 函数，它们不再使用

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
  
  document.getElementById('postsArea').classList.add('hidden')
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
  let postsToDisplay = posts
  
  if (selectedTagId) {
    postsToDisplay = posts.filter(post => 
      post.tags && post.tags.some(t => t.id === selectedTagId)
    )
  }
  
  // 按更新时间从新到旧排序
  postsToDisplay.sort((a, b) => 
    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  )
  
  renderPostsList(postsToDisplay)
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
    .select()
    .maybeSingle()

  if (error) return alert(error.message)

  // 添加 tags 字段（新文章没有标签）
  const newPost = {
    ...data,
    tags: []
  }

  posts.unshift(newPost)
  currentId = data.id
  
  await openEditorPage(data.id)
}

async function handleSavePost() {
  if (!currentId) return
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .update({
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      updated_at: new Date().toISOString()  // 显式设置 updated_at
    })
    .eq('id', currentId)
    .eq('author_id', user.id)
    .select()
    .maybeSingle()

  if (error) return alert(error.message)

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
    
    if (tagError) return alert(tagError.message)

    // 更新标签使用次数
    for (const tag of currentPostTags) {
      await sb.rpc('increment_tag_usage', { tag_id: tag.id })
    }
  }

  // 关键修复：重新加载这篇文章的完整信息（包括标签）
  const { data: fullPost, error: fetchError } = await sb
    .from('posts')
    .select(`
      *,
      post_tags (
        tags (*)
      )
    `)
    .eq('id', currentId)
    .maybeSingle()

  if (!fetchError && fullPost) {
    // 转换格式
    const updatedPost = {
      ...fullPost,
      tags: (fullPost.post_tags || []).map(pt => pt.tags)
    }
    
    // 更新本地数组
    const idx = posts.findIndex(p => p.id === currentId)
    if (idx !== -1) {
      posts[idx] = updatedPost
    }
  }
  
  alert('保存成功')
  closeEditorPage()
}