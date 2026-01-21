let allTags = []
let currentPostTags = []

async function loadAllTags() {
  const { data, error } = await sb
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })

  if (error) console.error(error)
  allTags = data || []
  renderSidebarTags()
}

function renderSidebarTags() {
  const tagsList = document.getElementById('tagsList')
  tagsList.innerHTML = ''
  
  allTags.forEach(tag => {
    const btn = document.createElement('button')
    btn.className = 'tag-badge-sidebar' + (selectedTagId === tag.id ? ' active' : '')
    btn.textContent = `${tag.name} (${tag.usage_count})`
    btn.onclick = () => selectTagFilter(tag.id)
    tagsList.appendChild(btn)
  })
}

function selectTagFilter(tagId) {
  selectedTagId = selectedTagId === tagId ? null : tagId
  renderSidebarTags()
  displayPostsByTag()
}

function renderEditorTags() {
  const tagsList = document.getElementById('currentTagsList')
  tagsList.innerHTML = ''
  
  allTags.forEach(tag => {
    const isActive = currentPostTags.some(t => t.id === tag.id)
    const div = document.createElement('div')
    div.className = 'tag-badge' + (isActive ? ' active' : '')
    div.textContent = tag.name
    div.onclick = () => toggleTag(tag)
    tagsList.appendChild(div)
  })
}

function toggleTag(tag) {
  const idx = currentPostTags.findIndex(t => t.id === tag.id)
  if (idx !== -1) {
    currentPostTags.splice(idx, 1)
  } else {
    currentPostTags.push(tag)
  }
  renderEditorTags()
}

async function handleAddTag(tagName) {
  tagName = tagName.trim()
  if (!tagName) return

  let tag = allTags.find(t => t.name === tagName)
  
  if (!tag) {
    const { data, error } = await sb
      .from('tags')
      .insert({ name: tagName })
      .select()
      .maybeSingle()
    
    if (error) return alert(error.message)
    tag = data
    allTags.push(tag)
    renderSidebarTags()
  }

  if (!currentPostTags.find(t => t.id === tag.id)) {
    currentPostTags.push(tag)
  }

  renderEditorTags()
}

async function loadPostTags(postId) {
  const { data, error } = await sb
    .from('post_tags')
    .select('tags(*)')
    .eq('post_id', postId)

  if (error) console.error(error)
  currentPostTags = (data || []).map(pt => pt.tags)
  renderEditorTags()
}