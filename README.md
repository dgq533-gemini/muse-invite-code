# Muse 邀请码 · 码池共享

极简苹果风的 Muse AI 邀请码共享池网站。免费领取、社区共享、无需登录。

## ✨ 特性

- **极简苹果风设计** — 大留白、优雅动效、深浅色自适应
- **邀请码池** — 领取、复制、反馈失效、分享
- **重点推荐** — 通过隐藏管理页设置优先推荐的邀请码
- **SEO/GEO 优化** — 完整 meta、Open Graph、结构化数据、sitemap
- **响应式** — 完美适配移动端与桌面端
- **零依赖** — 纯 HTML/CSS/JS，秒开速度

## 🚀 部署到 Vercel

### 方式一：一键部署

1. 将本项目推送到 GitHub
2. 登录 [vercel.com](https://vercel.com)
3. 点击 **New Project** → 导入 GitHub 仓库
4. 直接点击 **Deploy**（无需构建配置）

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel
```

## 🔒 管理后台

访问 `https://你的域名/admin.html` 进入管理后台。

- 默认密码：`admin123`
- **请立即修改密码**：编辑 `admin.js` 中的 `ADMIN_PASSWORD` 变量
- 可设置重点推荐邀请码（优先展示 + 优先领取）
- 可管理码池（增删、重置、清空）

## 📁 项目结构

```
.
├── index.html        # 首页
├── admin.html        # 隐藏管理后台
├── style.css         # 样式（极简苹果风）
├── app.js            # 首页逻辑
├── admin.js          # 后台逻辑
├── favicon.svg       # 图标
├── robots.txt        # 爬虫规则
├── sitemap.xml       # 站点地图
├── vercel.json       # Vercel 配置
└── .gitignore
```

## 🛠 自定义

| 项目 | 文件 | 说明 |
|------|------|------|
| 站点标题/描述 | `index.html` | 修改 `<title>` 和 `<meta>` |
| 域名 | `index.html`, `robots.txt`, `sitemap.xml` | 替换 `muse.monk.party` |
| 管理密码 | `admin.js` | 修改 `ADMIN_PASSWORD` |
| 初始邀请码 | `app.js`, `admin.js` | 修改 `SEED_CODES` |

## 📊 数据说明

邀请码数据存储在浏览器 `localStorage` 中，适合演示和轻量使用。如需多用户共享数据，建议接入后端 API 或 Serverless 函数。

## ⚠️ 免责声明

本项目为社区共享工具，非 Meta/Muse 官方。不索要任何登录信息，请勿为邀请码付费。
