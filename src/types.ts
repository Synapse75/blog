// src/types.ts — 共享类型定义

/** 文章标签 */
export interface PostTag {
  name: string
  id: string
}

/** 文章数据（与 md-loader.js 中 localPosts 对应） */
export interface Post {
  id: string
  title: string
  date: string
  slug: string
  content: string
  excerpt: string
  category: string
  subcategory: string
  tags: PostTag[]
  file: string
  created_at: string
  updated_at: string
}

/** 从 window 上暴露的全局变量/函数（原有 vanilla JS） */
declare global {
  /** 本地文章列表（md-loader.js 定义） */
  var localPosts: Post[]
  /** 导航到指定 hash（router.js 定义） */
  function navigateTo(hash: string): void
  /** 生成文章的 hash 路径（md-loader.js 定义） */
  function getPostHash(post: Post): string
  /** HTML 转义（posts.js 定义） */
  function escapeHtml(text: string): string
}
