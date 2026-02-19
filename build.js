#!/usr/bin/env node
// build.js — 扫描 posts/ 目录（含子文件夹分类），生成 posts/index.json
// 规则：
//   - 文件夹名 = 分类（posts/技术/xxx.md → 分类"技术"）
//   - 标题 = 正文第一个 # 标题行
//   - slug = front matter 里指定，或从文件名自动生成
//   - tags = front matter 里指定（可选）
//   - created_at = git 首次提交时间，回退到文件 birthtime
//   - updated_at = 文件修改时间（mtime）
//   - 文件名随便取，不影响 URL

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const POSTS_DIR = path.join(__dirname, 'posts')
const OUTPUT = path.join(POSTS_DIR, 'index.json')

// ========== Front Matter 解析（只需 slug 和 tags）==========
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { meta: {}, body: content }

  const yamlStr = match[1]
  const body = content.slice(match[0].length).trim()
  const meta = {}

  let currentKey = null
  let inArray = false

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (inArray && /^\s+-\s+(.+)/.test(line)) {
      const val = line.match(/^\s+-\s+(.+)/)[1].trim()
      meta[currentKey].push(val)
      continue
    }

    const kvMatch = trimmed.match(/^(\w+)\s*:\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const val = kvMatch[2].trim()

      if (val === '' || val === '|' || val === '>') {
        meta[currentKey] = []
        inArray = true
        continue
      }

      if (val.startsWith('[') && val.endsWith(']')) {
        meta[currentKey] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        inArray = false
        continue
      }

      meta[currentKey] = val.replace(/^['"]|['"]$/g, '')
      inArray = false
    }
  }

  return { meta, body }
}

// ========== 从正文提取标题（第一个 # 行）==========
function extractTitle(body) {
  const match = body.match(/^#{1,2}\s+(.+)/m)
  return match ? match[1].trim() : null
}

// ========== 从文件名生成 slug ==========
function fileNameToSlug(fileName) {
  return fileName
    .replace(/\.md$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-?/, '') // 去掉开头日期前缀
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'post'
}

// ========== Git 日期检测 ==========
function getGitCreatedDate(filePath) {
  try {
    const result = execSync(
      `git log --follow --diff-filter=A --format=%aI -- "${filePath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()
    if (result) {
      const lines = result.split('\n')
      return lines[lines.length - 1] // 最早的一次
    }
  } catch (e) { /* git not available */ }
  return null
}

// ========== 递归扫描 MD 文件 ==========
function scanPosts(dir, category = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const results = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // 跳过隐藏文件夹和 node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      // 子文件夹名 = 分类
      results.push(...scanPosts(fullPath, entry.name))
    } else if (entry.name.endsWith('.md')) {
      results.push({ filePath: fullPath, fileName: entry.name, category })
    }
  }

  return results
}

// ========== 构建索引 ==========
function buildIndex() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('posts/ 目录不存在')
    process.exit(1)
  }

  const files = scanPosts(POSTS_DIR)
  const posts = []

  for (const { filePath, fileName, category } of files) {
    // 跳过 index.json
    if (fileName === 'index.json') continue

    const content = fs.readFileSync(filePath, 'utf-8')
    const stat = fs.statSync(filePath)
    const { meta, body } = parseFrontMatter(content)

    // 标题：从正文第一个 # 提取
    const title = extractTitle(body)
    if (!title) {
      console.warn(`⚠️  跳过 ${fileName}：正文中没有 # 标题`)
      continue
    }

    // slug：优先 front matter，否则从文件名生成
    const slug = meta.slug || fileNameToSlug(fileName)

    // 日期：git 首次提交 → 文件创建时间
    const gitCreated = getGitCreatedDate(filePath)
    const createdAt = gitCreated || stat.birthtime.toISOString()
    const updatedAt = stat.mtime.toISOString()

    // 获取 created 的日期部分 YYYY-MM-DD
    const dateStr = createdAt.slice(0, 10)

    // 摘要：去掉 markdown 语法，取前 200 字符
    const excerpt = body
      .replace(/^#{1,6}\s+.+/gm, '')  // 去标题行
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`~]/g, '')
      .replace(/\r?\n/g, ' ')
      .trim()
      .slice(0, 200)

    // 相对路径（用于前端 fetch）
    const relPath = path.relative(POSTS_DIR, filePath).replace(/\\/g, '/')

    posts.push({
      title,
      slug,
      date: dateStr,
      created_at: createdAt,
      updated_at: updatedAt,
      category,
      tags: meta.tags || [],
      file: relPath,
      excerpt
    })
  }

  // 按创建日期倒序
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2), 'utf-8')

  // 统计
  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))]
  const tagSet = new Set()
  posts.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)))

  console.log(`已生成 posts/index.json`)
  console.log(`   ${posts.length} 篇文章`)
  if (categories.length) console.log(`   分类: ${categories.join(', ')}`)
  if (tagSet.size) console.log(`   标签: ${[...tagSet].join(', ')}`)

  const recent = [...posts].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  if (recent.length > 0) {
    console.log(`   最近更新: ${recent[0].title} (${new Date(recent[0].updated_at).toLocaleString()})`)
  }

  return posts
}

// ========== HTML 转义（构建时用）==========
function escapeHtmlBuild(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ========== 站点配置 ==========
const SITE_URL = 'https://synapse75.github.io/blog'

// ========== 为每篇文章生成独立的静态 HTML 页面（SEO 友好）==========
async function buildStaticPages(posts) {
  const { marked } = await import('marked')

  let generated = 0

  for (const post of posts) {
    const [year, month, day] = post.date.split('-')
    const dirPath = path.join(__dirname, year, month, day, post.slug)

    // 读取原始 Markdown
    const filePath = path.join(POSTS_DIR, post.file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { body } = parseFrontMatter(content)

    // 去掉标题行（页面已有 <h1>）
    const bodyNoTitle = body.replace(/^#{1,2}\s+.+\r?\n+/, '').trim()
    let htmlContent = marked.parse(bodyNoTitle)

    // 为所有图片添加 lazy loading
    htmlContent = htmlContent.replace(/<img /g, '<img loading="lazy" ')

    // 根路径（始终 4 层深度：year/month/day/slug）
    const rootPath = '../../../../'
    const encodedSlug = encodeURIComponent(post.slug)
    const postUrl = `${SITE_URL}/${year}/${month}/${day}/${encodedSlug}/`

    // 分类 HTML
    const categoryHtml = post.category
      ? `<div class="post-detail-meta-item post-detail-category">${escapeHtmlBuild(post.category)}</div>`
      : ''

    // 标签 HTML
    const tagsHtml = (post.tags && post.tags.length > 0)
      ? `<div class="post-detail-tags">${post.tags.map(t => `<span class="post-detail-tag">${escapeHtmlBuild(t)}</span>`).join('')}</div>`
      : ''

    const pageHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtmlBuild(post.title)} - Blog</title>
  <meta name="description" content="${escapeHtmlBuild(post.excerpt)}">
  <meta property="og:title" content="${escapeHtmlBuild(post.title)}">
  <meta property="og:description" content="${escapeHtmlBuild(post.excerpt)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${postUrl}">
  <meta property="og:site_name" content="Synapse75 Blog">
  <meta property="article:published_time" content="${post.created_at}">
  <meta property="article:modified_time" content="${post.updated_at}">
  ${post.tags.map(t => `<meta property="article:tag" content="${escapeHtmlBuild(t)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtmlBuild(post.title)}">
  <meta name="twitter:description" content="${escapeHtmlBuild(post.excerpt)}">
  <link rel="canonical" href="${postUrl}">
  <link rel="icon" href="https://github.com/synapse75.png" type="image/png">
  <link rel="stylesheet" href="${rootPath}style.css">
</head>
<body>
  <div class="static-page">
    <nav class="static-nav">
      <a href="${rootPath}" class="static-nav-home">← 博客首页</a>
      <a href="${rootPath}#/post/${post.date}/${encodedSlug}" class="static-nav-interactive">💬 互动版</a>
    </nav>
    <article>
      <div class="post-detail-header">
        <h1 class="post-detail-title">${escapeHtmlBuild(post.title)}</h1>
        <div class="post-detail-meta">
          ${categoryHtml}
          <div class="post-detail-meta-item">📅 ${post.date}</div>
        </div>
        ${tagsHtml}
      </div>
      <div class="post-detail-content markdown-body">${htmlContent}</div>
    </article>
    <footer class="static-footer">
      <a href="${rootPath}#/post/${post.date}/${encodedSlug}">💬 查看评论与互动</a>
      <span class="static-footer-sep">·</span>
      <a href="${rootPath}">← 返回首页</a>
    </footer>
  </div>
</body>
</html>`

    fs.mkdirSync(dirPath, { recursive: true })
    fs.writeFileSync(path.join(dirPath, 'index.html'), pageHtml, 'utf-8')
    generated++
  }

  console.log(`   生成了 ${generated} 个静态 SEO 页面`)
}

// ========== 生成 sitemap.xml ==========
function buildSitemap(posts) {
  const now = new Date().toISOString().slice(0, 10)

  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${now}</lastmod>\n    <priority>1.0</priority>\n  </url>`
  ]

  for (const post of posts) {
    const [year, month, day] = post.date.split('-')
    const encodedSlug = encodeURIComponent(post.slug)
    const lastmod = post.updated_at.slice(0, 10)
    urls.push(`  <url>\n    <loc>${SITE_URL}/${year}/${month}/${day}/${encodedSlug}/</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>0.8</priority>\n  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml, 'utf-8')
  console.log(`   生成了 sitemap.xml（${urls.length} 个 URL）`)
}

// ========== 主流程 ==========
async function main() {
  const posts = buildIndex()
  await buildStaticPages(posts)
  buildSitemap(posts)
}

main()
