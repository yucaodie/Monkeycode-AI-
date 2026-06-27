# Knowledge Assistant - 知识助手

个人知识管理 Web 应用，支持快速保存、智能搜索和按需输出。

## 功能特性

- ✏️ **快速保存** - 粘贴文本或上传文档（PDF/Word/图片），AI 自动分类打标签
- 🔍 **语义搜索** - 自然语言查询，快速找到相关知识
- 📄 **智能输出** - 按你要求整理成技术方案、申报表等格式
- 🏷️ **自动标签** - AI 自动生成标签，方便组织和管理
- 💾 **本地存储** - SQLite 本地存储，数据安全不出本地

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- Axios (HTTP 客户端)

### 后端
- Node.js + Express
- TypeScript
- Better-SQLite3 (数据库)
- OpenAI SDK (AI 能力)

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
# 根目录安装
npm install

# 或使用 workspaces
npm install --workspaces
```

### 配置环境变量

在 `backend/.env` 文件中配置：

```env
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
PORT=3001
DATABASE_PATH=./data/knowledge.db
```

> 注意：如果没有配置 API key，AI 功能会降级（不影响基本使用）

### 启动开发服务器

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:backend  # 后端 (http://localhost:3001)
npm run dev:frontend # 前端 (http://localhost:5173)
```

### 访问应用

打开浏览器访问：`http://localhost:5173`

## API 文档

### 知识管理

```bash
# 创建知识
POST /api/knowledge
{
  "content": "内容",
  "original_type": "text|pdf|word|image",
  "title": "标题（可选，AI 会自动生成）"
}

# 获取列表
GET /api/knowledge?limit=20&offset=0&tagId=1

# 获取详情
GET /api/knowledge/:id

# 更新
PUT /api/knowledge/:id

# 删除
DELETE /api/knowledge/:id
```

### 搜索

```bash
# 语义搜索
GET /api/search?q=人工智能&limit=10
```

### 标签

```bash
# 获取所有标签
GET /api/knowledge/tags/list
```

## 项目结构

```
knowledge-assistant/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── backend/           # 后端项目
│   ├── src/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   ├── data/         # SQLite 数据库文件
│   └── uploads/      # 上传文件存储
├── .monkeycode/      # 项目文档和规格
│   └── specs/
│       └── knowledge-assistant/
│           ├── requirements.md
│           ├── design.md
│           └── tasklist.md
└── package.json      # 根工作空间配置
```

## 数据模型

### Knowledge (知识片段)
- id, user_id, content, original_type
- file_path, title, summary
- created_at, updated_at

### Tag (标签)
- id, user_id, name, color
- created_at

### Template (模板)
- id, user_id, name, type
- content, description, is_preset
- created_at

## 开发进度

✅ 已完成 (MVP 核心功能)
- 前后端项目骨架
- 数据库设计和初始化（6 个表）
- 知识管理 API (CRUD + 标签关联)
- AI 客户端服务（标题/摘要/标签生成）
- 语义搜索服务（向量检索 + 降级策略）
- 文档解析服务（PDF/Word/图片 OCR）
- 文件上传功能（拖拽上传）
- 输出模板服务（技术方案/申报表）
- 自然语言输出生成
- 前端界面（首页/搜索/上传/输出面板）

🚧 下一步优化
- 知识详情页面
- 标签管理页面
- 历史记录页面
- 聊天式交互界面
- 批量操作支持

## License

MIT
