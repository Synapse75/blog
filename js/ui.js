// js/ui.js
const listEl = document.getElementById('list')
const titleInput = document.getElementById('title')
const contentInput = document.getElementById('content')
const saveBtn = document.getElementById('saveBtn')
const newBtn = document.getElementById('newBtn')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('loginBtn')
const confirmLoginBtn = document.getElementById('confirmLoginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const loginModal = document.getElementById('loginModal')
const closeLoginBtn = document.getElementById('closeLoginBtn')
const goRegisterBtn = document.getElementById('goRegisterBtn')

const regUsernameInput = document.getElementById('regUsername')
const regEmailInput = document.getElementById('regEmail')
const regPasswordInput = document.getElementById('regPassword')
const confirmRegisterBtn = document.getElementById('confirmRegisterBtn')
const registerModal = document.getElementById('registerModal')
const closeRegisterBtn = document.getElementById('closeRegisterBtn')
const goLoginBtn = document.getElementById('goLoginBtn')

const tagInput = document.getElementById('tagInput')
const backBtn = document.getElementById('backBtn')
const logoutBtn2 = document.getElementById('logoutBtn2')

// 等待 DOM 完全加载后再绑定事件
document.addEventListener('DOMContentLoaded', () => {
  // ========== 认证事件绑定 ==========
  if (loginBtn) {
    loginBtn.onclick = () => {
      if (!isLoggedIn) openLoginModal()
    }
  }

  if (closeLoginBtn) closeLoginBtn.onclick = () => closeLoginModal()

  if (confirmLoginBtn) confirmLoginBtn.onclick = handleLogin

  if (goRegisterBtn) {
    goRegisterBtn.onclick = (e) => {
      e.preventDefault()
      closeLoginModal()
      openRegisterModal()
    }
  }

  if (goLoginBtn) {
    goLoginBtn.onclick = (e) => {
      e.preventDefault()
      closeRegisterModal()
      openLoginModal()
    }
  }

  if (closeRegisterBtn) closeRegisterBtn.onclick = () => closeRegisterModal()

  if (confirmRegisterBtn) confirmRegisterBtn.onclick = handleRegister

  // ========== 文章事件绑定 ==========
  if (newBtn) newBtn.onclick = handleNewPost

  if (saveBtn) saveBtn.onclick = handleSavePost

  if (backBtn) backBtn.onclick = closeEditorPage

  // ========== 标签事件绑定 ==========
  if (tagInput) {
    tagInput.onkeypress = async (e) => {
      if (e.key !== 'Enter') return
      const tagName = tagInput.value.trim()
      if (tagName) {
        await handleAddTag(tagName)
        tagInput.value = ''
      }
    }
  }

  // ========== 初始化应用 ==========
  initializeApp()
})

// 初始化应用的异步函数
async function initializeApp() {
  try {
    const { data: { user } } = await sb.auth.getUser()
    
    if (user) {
      isLoggedIn = true
      await loadPosts()
    }
    
    await loadAllTags()
    displayPostsByTag()
    updateLoginUI()
  } catch (err) {
    console.error('初始化错误:', err)
    await loadAllTags()
    displayPostsByTag()
    updateLoginUI()
  }
}
