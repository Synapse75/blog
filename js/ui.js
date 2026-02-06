// 加载 GitHub 信息
async function loadGitHubStats() {
  try {
    const response = await fetch('https://api.github.com/users/synapse75')
    if (!response.ok) throw new Error('Failed to fetch')

    const data = await response.json()
    const repos = data.public_repos || 0
    const followers = data.followers || 0

    // 统计 Stars（最多前 100 个仓库）
    let stars = 0
    const reposRes = await fetch('https://api.github.com/users/synapse75/repos?per_page=100')
    if (reposRes.ok) {
      const reposData = await reposRes.json()
      stars = reposData.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
    }

    document.getElementById('githubStars').textContent = stars
    document.getElementById('githubFollowers').textContent = followers
    document.getElementById('githubRepos').textContent = repos
  } catch (error) {
    console.error('加载 GitHub 信息失败:', error)
  }
}

// js/ui.js
const loginBtn = document.getElementById('loginBtn')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const confirmLoginBtn = document.getElementById('confirmLoginBtn')
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
const saveBtn = document.getElementById('saveBtn')
const newBtn = document.getElementById('newBtn')
const backBtn = document.getElementById('backBtn')

// 等待 DOM 完全加载后再绑定事件
document.addEventListener('DOMContentLoaded', () => {
  const logoLink = document.getElementById('logoLink')
  if (logoLink) {
    logoLink.addEventListener('click', () => {
      switchTab('posts')
    })
  }

  // ========== 顶部导航 Tab 切换 ==========
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault()
      switchTab(link.dataset.tab)
    }
  })

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
    loadGitHubStats()
})

// Tab 切换函数
function switchTab(tab) {
  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
  const activeLink = document.querySelector(`.nav-link[data-tab="${tab}"]`)
  if (activeLink) activeLink.classList.add('active')

  // 隐藏所有 tab 页面
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'))
  // 也隐藏编辑页
  const editorPage = document.getElementById('editorPage')
  if (editorPage) editorPage.classList.add('hidden')

  // 显示对应页面
  switch (tab) {
    case 'posts':
      document.getElementById('postsArea').classList.remove('hidden')
      displayPostsByTag()
      break
    case 'tags':
      document.getElementById('tagsPage').classList.remove('hidden')
      renderTagsPage()
      break
    case 'categories':
    case 'about':
      // 未来实现
      break
  }
}

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
    displayPostsByTag()
    updateLoginUI()
  }
}
