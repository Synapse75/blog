// js/supabase.js
const sb = supabase.createClient(
  'https://fczfvtzbdfiidhwsrlgk.supabase.co',
  'sb_publishable_DHmYOccvtT13C5jS4mObFQ_9RqHvYjA'
)

async function requireUser() {
  const { data: { user }, error } = await sb.auth.getUser()
  if (error || !user) {
    alert('请先登录')
    throw new Error('Not authenticated')
  }
  return user
}
