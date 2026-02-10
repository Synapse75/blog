// js/ui.js — 界面初始化（纯静态，无后端）

// ========== 加载 GitHub 信息 ==========
async function loadGitHubStats() {
  try {
    const res = await fetch('https://api.github.com/users/synapse75')
    if (!res.ok) throw new Error('Failed to fetch')

    const data = await res.json()
    document.getElementById('githubStars').textContent = '0'
    document.getElementById('githubFollowers').textContent = data.followers || 0
    document.getElementById('githubRepos').textContent = data.public_repos || 0

    // 统计 Stars
    const reposRes = await fetch('https://api.github.com/users/synapse75/repos?per_page=100')
    if (reposRes.ok) {
      const repos = await reposRes.json()
      const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0)
      document.getElementById('githubStars').textContent = stars
    }
  } catch (e) {
    console.error('加载 GitHub 信息失败:', e)
  }
}

// ========== Tab 切换 ==========
function switchTab(tab) {
  // 导航高亮
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
  const activeLink = document.querySelector(`.nav-link[data-tab="${tab}"]`)
  if (activeLink) activeLink.classList.add('active')

  // 隐藏所有 tab 页面 & 详情页
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'))
  const detailPage = document.getElementById('postDetailPage')
  if (detailPage) detailPage.classList.remove('active')

  // 显示对应页面
  switch (tab) {
    case 'posts':
      document.getElementById('postsArea').classList.remove('hidden')
      displayPosts()
      break
    case 'tags':
      document.getElementById('tagsPage').classList.remove('hidden')
      renderTagsPage()
      break
    case 'categories':
      document.getElementById('categoriesPage').classList.remove('hidden')
      renderCategoriesPage()
      break
    case 'about':
      document.getElementById('aboutPage').classList.remove('hidden')
      break
  }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  // Logo 点击回首页
  const logoLink = document.getElementById('logoLink')
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault()
      navigateTo('#/')
    })
  }

  // 导航链接
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault()
      const tab = link.dataset.tab
      navigateTo(tab === 'posts' ? '#/' : '#/' + tab)
    }
  })

  // 认证事件绑定
  const loginBtn = document.getElementById('loginBtn')
  if (loginBtn) loginBtn.onclick = () => { if (!isLoggedIn) openLoginModal() }

  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) logoutBtn.onclick = handleLogout

  const closeLoginBtn = document.getElementById('closeLoginBtn')
  if (closeLoginBtn) closeLoginBtn.onclick = closeLoginModal

  const confirmLoginBtn = document.getElementById('confirmLoginBtn')
  if (confirmLoginBtn) confirmLoginBtn.onclick = handleLogin

  const goRegisterBtn = document.getElementById('goRegisterBtn')
  if (goRegisterBtn) goRegisterBtn.onclick = (e) => { e.preventDefault(); closeLoginModal(); openRegisterModal() }

  const closeRegisterBtn = document.getElementById('closeRegisterBtn')
  if (closeRegisterBtn) closeRegisterBtn.onclick = closeRegisterModal

  const confirmRegisterBtn = document.getElementById('confirmRegisterBtn')
  if (confirmRegisterBtn) confirmRegisterBtn.onclick = handleRegister

  const goLoginBtn = document.getElementById('goLoginBtn')
  if (goLoginBtn) goLoginBtn.onclick = (e) => { e.preventDefault(); closeRegisterModal(); openLoginModal() }

  // 初始化
  initializeApp()
  loadGitHubStats()
})

async function initializeApp() {
  try {
    await loadLocalPosts()
    await checkAuth()
    handleRoute()
  } catch (err) {
    console.error('初始化错误:', err)
    handleRoute()
  }
}
