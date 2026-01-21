let isLoggedIn = false

function updateLoginUI() {
  if (isLoggedIn) {
    loginBtn.textContent = '已登录'
    loginBtn.disabled = true
  } else {
    loginBtn.textContent = '登录'
    loginBtn.disabled = false
  }
}

function openLoginModal() {
  loginModal.classList.remove('hidden')
}

function closeLoginModal() {
  loginModal.classList.add('hidden')
  emailInput.value = ''
  passwordInput.value = ''
}

function openRegisterModal() {
  registerModal.classList.remove('hidden')
}

function closeRegisterModal() {
  registerModal.classList.add('hidden')
  regUsernameInput.value = ''
  regEmailInput.value = ''
  regPasswordInput.value = ''
}

async function handleLogin() {
  const email = emailInput.value
  const password = passwordInput.value
  
  if (!email || !password) return alert('请输入邮箱和密码')

  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) return alert(error.message)

  isLoggedIn = true
  await loadPosts()
  updateLoginUI()
  displayPostsByTag()
  closeLoginModal()
}

async function handleRegister() {
  const username = regUsernameInput.value
  const email = regEmailInput.value
  const password = regPasswordInput.value
  
  if (!username || !email || !password) return alert('请填写所有字段')

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  })

  if (error) return alert(error.message)

  alert('注册成功！请查收邮件验证您的邮箱地址。')
  closeRegisterModal()
  openLoginModal()
}

async function handleLogout() {
  await sb.auth.signOut()
  isLoggedIn = false
  posts = []
  currentId = null
  currentPostTags = []
  selectedTagId = null
  updateLoginUI()
  renderSidebarTags()
  displayPostsByTag()
  closeEditorPage()
}