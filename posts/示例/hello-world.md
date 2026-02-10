---
tags:
  - 示例
  - 博客
---

# Hello World

这是第一篇 Markdown 文章，用来演示写作工作流。

## 使用方法

1. 在 `posts/` 目录（或子文件夹）创建 `.md` 文件，文件名随意
2. 子文件夹名 = 分类（如 `posts/技术/xxx.md`）
3. 正文第一行 `# 标题` 自动作为文章标题
4. 日期自动检测（git 首次提交 / 文件创建时间）
5. 运行 `node build.js` 生成索引，推送即可

## 快速创建文章

```bash
node new.js "文章标题"
node new.js "文章标题" --category 技术
node new.js "文章标题" --tags JS,前端 --category 技术
```

## Front Matter（可选）

只需要写 `tags`，其他全自动：

```yaml
---
tags:
  - 标签1
  - 标签2
---
```

如果不需要标签，front matter 都不用写，直接写正文。
