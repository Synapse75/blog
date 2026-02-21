// js/ui.js — 界面初始化（纯静态，无后端）

// ========== 加载 GitHub 信息 ==========
async function loadGitHubStats() {
  try {
    // 检查 localStorage 缓存（1小时有效）
    const cached = localStorage.getItem('githubStats')
    if (cached) {
      const { data, time } = JSON.parse(cached)
      if (Date.now() - time < 3600000) {
        document.getElementById('githubFollowing').textContent = data.following
        document.getElementById('githubFollowers').textContent = data.followers
        document.getElementById('githubRepos').textContent = data.repos
        return
      }
    }

    const res = await fetch('https://api.github.com/users/synapse75')
    if (!res.ok) throw new Error('Failed to fetch')

    const userData = await res.json()

    const statsData = {
      following: userData.following || 0,
      followers: userData.followers || 0,
      repos: userData.public_repos || 0
    }

    document.getElementById('githubFollowing').textContent = statsData.following
    document.getElementById('githubFollowers').textContent = statsData.followers
    document.getElementById('githubRepos').textContent = statsData.repos

    // 缓存到 localStorage
    localStorage.setItem('githubStats', JSON.stringify({ data: statsData, time: Date.now() }))
  } catch (e) {
    console.error('加载 GitHub 信息失败:', e)
  }
}

// ========== 加载关于页面 ==========
async function loadAboutPage() {
  const container = document.getElementById('aboutContent')
  if (!container || container.dataset.loaded) return
  try {
    const res = await fetch('about.md?t=' + Date.now())
    if (!res.ok) throw new Error('Fetch failed')
    const md = await res.text()
    container.innerHTML = marked.parse(md)
    container.dataset.loaded = 'true'
  } catch (e) {
    container.innerHTML = '<p>加载关于页面失败</p>'
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
      loadAboutPage()
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

  const githubLoginBtn = document.getElementById('githubLoginBtn')
  if (githubLoginBtn) githubLoginBtn.onclick = handleGitHubLogin

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
