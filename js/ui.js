// js/ui.js
const listEl = document.getElementById('list')
const titleInput = document.getElementById('title')
const contentInput = document.getElementById('content')
const saveBtn = document.getElementById('saveBtn')
const newBtn = document.getElementById('newBtn')

function renderList() {
  listEl.innerHTML = ''
  posts.forEach(p => {
    const div = document.createElement('div')
    div.className = 'item' + (p.id === currentId ? ' active' : '')
    div.textContent = p.title || '（无标题）'
    div.onclick = () => selectPost(p.id)
    listEl.appendChild(div)
  })
}

function renderEditor() {
  const post = posts.find(p => p.id === currentId)
  if (!post) return
  titleInput.value = post.title || ''
  contentInput.value = post.content || ''
}

function selectPost(id) {
  currentId = id
  renderList()
  renderEditor()
}

newBtn.onclick = async () => {
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .insert({
      title: '新记录',
      content: '',
      author_id: user.id
    })
    .select()
    .single()

  if (error) return alert(error.message)

  posts.unshift(data)
  currentId = data.id
  renderList()
  renderEditor()
}

saveBtn.onclick = async () => {
  if (!currentId) return
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .update({
      title: titleInput.value,
      content: contentInput.value
    })
    .eq('id', currentId)
    .eq('author_id', user.id)
    .select()
    .single()

  if (error) return alert(error.message)

  const idx = posts.findIndex(p => p.id === currentId)
  posts[idx] = data
  renderList()
}

// init
;(async () => {
  await loadPosts()
  if (posts.length) currentId = posts[0].id
  renderList()
  renderEditor()
})()

const emailInput = document.getElementById('email')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')

loginBtn.onclick = async () => {
  const email = emailInput.value
  if (!email) return alert('输入邮箱')

  const { error } = await sb.auth.signInWithOtp({ email })
  if (error) alert(error.message)
  else alert('登录链接已发送到邮箱')
}

logoutBtn.onclick = async () => {
  await sb.auth.signOut()
  location.reload()
}
