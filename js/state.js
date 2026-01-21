// js/state.js
let posts = []
let currentId = null

async function loadPosts() {
  const user = await requireUser()

  const { data, error } = await sb
    .from('posts')
    .select(`
      *,
      post_tags (
        tags (*)
      )
    `)
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (error) throw error
  
  // 将 post_tags 数组转换为 tags 数组
  posts = (data || []).map(post => ({
    ...post,
    tags: (post.post_tags || []).map(pt => pt.tags)
  }))
}
