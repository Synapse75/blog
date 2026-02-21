// js/auth.js — 访客认证（用于点赞 & 评论）
let isLoggedIn = false
let currentUser = null

// 获取当前用户的显示名称
function getDisplayName() {
  if (!currentUser) return ''
  const meta = currentUser.user_metadata || {}
  return meta.user_name || meta.preferred_username || meta.username || '用户'
}

function updateLoginUI() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  if (!loginBtn) return

  if (isLoggedIn && currentUser) {
    loginBtn.textContent = getDisplayName()
    loginBtn.disabled = true
    if (logoutBtn) logoutBtn.classList.remove('hidden')
  } else {
    loginBtn.textContent = '登录'
    loginBtn.disabled = false
    if (logoutBtn) logoutBtn.classList.add('hidden')
  }
}

function openLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden')
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden')
}

async function handleGitHubLogin() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  })
  if (error) alert(error.message)
}

async function handleLogout() {
  await sb.auth.signOut()
  isLoggedIn = false
  currentUser = null
  updateLoginUI()
  refreshInteractions()
}

// 检查当前登录状态
async function checkAuth() {
  try {
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      currentUser = user
      isLoggedIn = true
    }
  } catch (e) {
    // 未登录
  }
  updateLoginUI()
}

// 刷新互动区域（如果当前在文章详情页）
function refreshInteractions() {
  const detailPage = document.getElementById('postDetailPage')
  if (!detailPage || !detailPage.classList.contains('active')) return
  const section = detailPage.querySelector('.interactions-section')
  if (!section) return
  const postId = section.dataset.postId
  if (postId) renderInteractions(postId, section)
}
