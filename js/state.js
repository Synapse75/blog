// js/state.js
let posts = []
let currentId = null

async function loadPosts() {
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  posts = data || []
}
