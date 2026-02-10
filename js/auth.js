// js/auth.js — 访客认证（用于点赞 & 评论）
let isLoggedIn = false
let currentUser = null

function updateLoginUI() {
  const loginBtn = document.getElementById('loginBtn')
  const logoutBtn = document.getElementById('logoutBtn')
  if (!loginBtn) return

  if (isLoggedIn && currentUser) {
    const name = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || '用户'
    loginBtn.textContent = name
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
  document.getElementById('loginEmail').value = ''
  document.getElementById('loginPassword').value = ''
}

function openRegisterModal() {
  document.getElementById('registerModal').classList.remove('hidden')
}

function closeRegisterModal() {
  document.getElementById('registerModal').classList.add('hidden')
  document.getElementById('regUsername').value = ''
  document.getElementById('regEmail').value = ''
  document.getElementById('regPassword').value = ''
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value
  if (!email || !password) return alert('请输入邮箱和密码')

  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) return alert(error.message)

  currentUser = data.user
  isLoggedIn = true
  updateLoginUI()
  closeLoginModal()
  // 刷新当前文章详情的互动区域
  refreshInteractions()
}

async function handleRegister() {
  const username = document.getElementById('regUsername').value
  const email = document.getElementById('regEmail').value
  const password = document.getElementById('regPassword').value
  if (!username || !email || !password) return alert('请填写所有字段')

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
  if (error) return alert(error.message)

  alert('注册成功！请查收邮件验证您的邮箱地址。')
  closeRegisterModal()
  openLoginModal()
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
