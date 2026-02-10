// js/interactions.js — 点赞 & 评论（Supabase）
// post_id 使用 "YYYY-MM-DD/slug" 格式作为唯一标识

// ========== 点赞 ==========
async function getLikeCount(postId) {
  const { count, error } = await sb
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
  return error ? 0 : count
}

async function hasUserLiked(postId) {
  if (!currentUser) return false
  const { data } = await sb
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', currentUser.id)
    .maybeSingle()
  return !!data
}

async function toggleLike(postId) {
  if (!isLoggedIn) {
    openLoginModal()
    return
  }

  const liked = await hasUserLiked(postId)

  if (liked) {
    await sb
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
  } else {
    await sb
      .from('likes')
      .insert({ post_id: postId, user_id: currentUser.id })
  }

  // 刷新互动区域
  const section = document.querySelector(`.interactions-section[data-post-id="${postId}"]`)
  if (section) renderInteractions(postId, section)
}

// ========== 评论 ==========
async function getComments(postId) {
  const { data, error } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return error ? [] : (data || [])
}

async function submitComment(postId) {
  if (!isLoggedIn) {
    openLoginModal()
    return
  }

  const input = document.getElementById('commentInput')
  const content = input.value.trim()
  if (!content) return

  const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || '匿名'

  const { error } = await sb
    .from('comments')
    .insert({
      post_id: postId,
      user_id: currentUser.id,
      username: username,
      content: content
    })

  if (error) return alert('评论失败: ' + error.message)

  input.value = ''

  // 刷新互动区域
  const section = document.querySelector(`.interactions-section[data-post-id="${postId}"]`)
  if (section) renderInteractions(postId, section)
}

async function deleteComment(commentId, postId) {
  const { error } = await sb
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) return alert('删除失败: ' + error.message)

  const section = document.querySelector(`.interactions-section[data-post-id="${postId}"]`)
  if (section) renderInteractions(postId, section)
}

// ========== 渲染互动区域 ==========
async function renderInteractions(postId, container) {
  container.dataset.postId = postId

  // 并行加载点赞数、用户是否已赞、评论列表
  const [likeCount, liked, comments] = await Promise.all([
    getLikeCount(postId),
    hasUserLiked(postId),
    getComments(postId)
  ])

  const likeClass = liked ? 'like-btn liked' : 'like-btn'
  const likeIcon = liked ? '❤️' : '🤍'

  const commentsHtml = comments.map(c => {
    const time = new Date(c.created_at).toLocaleString('zh-CN')
    const isOwner = currentUser && c.user_id === currentUser.id
    const deleteBtn = isOwner
      ? `<button class="comment-delete" onclick="deleteComment('${c.id}', '${postId}')">删除</button>`
      : ''
    return `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(c.username)}</span>
          <span class="comment-time">${time}</span>
          ${deleteBtn}
        </div>
        <div class="comment-body">${escapeHtml(c.content)}</div>
      </div>
    `
  }).join('')

  const loginHint = isLoggedIn
    ? ''
    : '<p class="login-hint">登录后可以点赞和评论 <a href="javascript:void(0)" onclick="openLoginModal()">去登录</a></p>'

  container.innerHTML = `
    <div class="interactions-divider"></div>

    <!-- 点赞 -->
    <div class="like-section">
      <button class="${likeClass}" onclick="toggleLike('${postId}')">
        ${likeIcon} <span>${likeCount}</span>
      </button>
    </div>

    ${loginHint}

    <!-- 评论区 -->
    <div class="comments-section">
      <h3>评论 (${comments.length})</h3>
      ${isLoggedIn ? `
        <div class="comment-form">
          <textarea id="commentInput" placeholder="写下你的评论..." rows="3"></textarea>
          <button class="comment-submit-btn" onclick="submitComment('${postId}')">发表评论</button>
        </div>
      ` : ''}
      <div class="comments-list">
        ${commentsHtml || '<p class="no-comments">暂无评论</p>'}
      </div>
    </div>
  `
}
