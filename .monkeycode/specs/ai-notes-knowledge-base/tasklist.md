# 需求实施计划

- [x] 1. 数据库迁移 - 创建新表和扩展标签系统
  - 在 `backend/src/utils/database.ts` 中新增 10 张表的 CREATE TABLE 语句（notebooks、notes、note_pages、note_page_versions、knowledge_folders、knowledge_files、knowledge_file_embeddings、note_page_refs、ai_model_configs、taggables）
  - 添加新表的索引和外键约束（级联删除）
  - 确保现有 7 张表不受影响，仅追加不修改
  - 需求引用：设计文档 Data Models 表 1-10

- [ ] 2. 实现 AI 模型配置管理
  - [x] 2.1 创建 ModelConfig 数据模型和 Repository
    - 在 `backend/src/models/` 中定义 ModelConfig 接口
    - 在 `backend/src/repositories/` 中实现 ModelConfigRepository（CRUD + 按类别查询 + 设置默认模型）
    - 需求引用：需求 6（AI 大模型管理）
  - [x] 2.2 实现模型配置管理 API 路由
    - 创建 `backend/src/routes/models.ts`，实现 GET/POST/PUT/DELETE 路由
    - 实现 POST /api/models/:id/test 连通性测试端点（发送简单请求验证 API 可达性）
    - 实现 PUT /api/models/:id/default 设置默认模型端点（同类互斥）
    - 在 `server.ts` 中挂载 `/api/models` 路由
    - 需求引用：需求 6 验收标准 1-7
  - [ ] 2.3 为模型配置服务编写单元测试
    - 验证默认模型唯一性逻辑
    - 验证连通性测试超时和错误处理

- [x] 3. 重构 AI 客户端支持多模型动态切换
  - 修改 `backend/src/services/AIClient.ts`，将硬编码的单模型改为从数据库动态获取
  - 实现 `chatComplete()` 方法（从问答模型类别取默认模型，按需创建临时 OpenAI client）
  - 实现 `generateEmbedding()` 方法（从向量模型类别取默认模型）
  - 实现 `rerank()` 方法（从重排序模型类别取默认模型，无此模型时跳过精排）
  - 保留现有的 `generateTitle()`、`generateSummary()`、`generateTags()` 方法，改为调用新的 `chatComplete()`
  - 需求引用：需求 6 验收标准 6，设计文档 AIClient v2 章节

- [x] 4. 检查点 - 确保 Phase 1 代码可编译且模型管理接口可调通

- [ ] 5. 实现知识库文件夹管理
  - [x] 5.1 创建 KnowledgeFolder 和 KnowledgeFile 数据模型和 Repository
    - 在 `backend/src/models/` 中定义接口
    - 在 `backend/src/repositories/` 中实现文件夹 CRUD + 文件 CRUD + 文件列表查询
    - 需求引用：需求 3（知识库模块 - 文件管理）
  - [x] 5.2 实现文件夹管理 API 路由
    - 创建 `backend/src/routes/knowledge-base.ts`
    - 实现文件夹的 GET/POST/PUT/DELETE
    - 实现文件的 GET/POST（上传）/PUT/DELETE
    - 在 `server.ts` 中挂载 `/api/knowledge-base` 路由
    - 需求引用：需求 3 验收标准 1-6

- [x] 6. 实现知识库文件上传和解析
  - 在知识库文件上传 API 中集成现有 PdfParser、WordParser、ImageParser（复用不重写）
  - 对 .md 文件直接读取 Markdown 正文存入 `content_markdown`
  - 对 .docx/.pdf 文件解析后存入 `content_markdown` 和 `content_structured`（JSON 结构）
  - 上传成功后自动调用 AI 生成文件摘要和标签建议
  - 需求引用：需求 4（知识库模块 - 文件解析与格式保留）验收标准 1-7

- [x] 7. 实现知识库文件向量化和语义搜索
  - 创建 `backend/src/services/KBService.ts`，调用 AIClient.generateEmbedding() 生成文件向量
  - 将向量存入 `knowledge_file_embeddings` 表
  - 实现语义搜索：生成查询向量 → 余弦相似度计算 → 返回相关性排序的文件列表
  - 复用现有 SearchService 的相似度计算模式和降级策略
  - 需求引用：需求 8（AI 知识库增强）验收标准 1-2

- [x] 8. 检查点 - 确保知识库后端 API 完整可测

- [ ] 9. 实现笔记层级管理
  - [x] 9.1 创建 Notebook、Note、NotePage 数据模型和 Repository
    - 在 `backend/src/models/` 中定义接口
    - 在 `backend/src/repositories/` 中实现笔记本/笔记/笔记页的 CRUD + 排序 + 移动
    - 需求引用：需求 1（笔记模块 - 层级管理）
  - [x] 9.2 实现笔记层级管理 API 路由
    - 创建 `backend/src/routes/notes.ts`
    - 实现笔记本 CRUD、笔记 CRUD、笔记页 CRUD 的完整 RESTful 路由
    - 实现笔记页自动保存（PUT 时同步生成 `plain_text` 剥离 HTML 标签用于搜索索引）
    - 在 `server.ts` 中挂载 `/api/notes` 路由
    - 需求引用：需求 1 验收标准 1-8，需求 2 验收标准 4-5

- [x] 10. 实现笔记页历史版本管理
  - 在 `backend/src/services/NotesService.ts` 中实现版本快照逻辑
  - 每次保存笔记页时创建版本快照存入 `note_page_versions` 表
  - 实现版本数量上限控制（超过 10 个时删除最旧版本）
  - 实现 GET /api/notes/pages/:id/versions 和 POST /api/notes/pages/:id/restore/:versionId
  - 需求引用：需求 1 验收标准 8，需求 2 验收标准 6

- [x] 11. 检查点 - 确保笔记后端 API 完整可测

- [x] 12. 搭建前端多页面路由框架
  - 在 `frontend/src/App.tsx` 中引入 `react-router-dom`（已安装但未使用）
  - 创建 `Layout.tsx`（侧边导航 + `<Outlet />`）和 `Sidebar.tsx`（导航菜单：笔记/知识库/输出/问答/设置）
  - 创建页面占位组件（NotesPage、KnowledgeBasePage、OutputPage、QAPage、SettingsPage），默认首页为笔记模块
  - 路由配置：`/notes` → NotesPage，`/knowledge-base` → KnowledgeBasePage，`/output` → OutputPage，`/qa` → QAPage，`/settings/models` → SettingsPage
  - 需求引用：设计文档页面路由设计章节

- [ ] 13. 实现知识库前端页面
  - [x] 13.1 实现 FolderList 和 FilePanel 组件
    - FolderList：左侧栏展示文件夹列表，支持创建/重命名/删除操作
    - FilePanel：右侧栏展示文件列表，支持上传/重命名/移动/删除/下载
    - 文件类型图标区分 .md/.docx/.pdf/图片
    - 需求引用：需求 3 验收标准 1-6
  - [x] 13.2 实现文件预览功能
    - .md 文件使用 Markdown 编辑器内联渲染
    - .docx/.pdf 文件解析后渲染结构化预览（标题层级/段落/表格）
    - 图片文件直接展示
    - 需求引用：需求 4 验收标准 4-5
  - [ ] 13.3 为知识库前端组件编写单元测试

- [x] 14. 重建笔记前端页面（笔记树 + 编辑器双栏布局）
  - [x] 14.1 实现 NoteTree 树形导航组件
    - 笔记本 > 笔记 > 笔记页完整层级树，展开/折叠/选中/右键菜单
    - 懒加载：展开笔记本才加载笔记，展开笔记才加载笔记页
    - 内联重命名：双击节点名称原地编辑
    - 拖拽排序：同级拖拽重排，跨级拖拽移动
    - 需求引用：需求 1 验收标准 1-10
  - [x] 14.2 重建 NotesPage 双栏布局
    - 左侧：NoteTree（笔记树，宽度 260px）
    - 右侧：NotePageEditor（TipTap 富文本编辑器）
    - 工具栏：新建笔记本按钮（树顶）
  - [x] 14.3 集成 TipTap 富文本编辑器
    - 安装 `@tiptap/core`、`@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extensions`
    - 封装 TipTapEditor 组件，配置工具栏（加粗/斜体/标题/列表/引用/代码块/链接/图片/表格）
    - 粘贴保留格式、从知识库插入图片
    - 需求引用：需求 2 验收标准 1-3
  - [x] 14.4 实现自动保存和版本管理
    - 30 秒定时保存 + 失焦保存（防抖 2 秒）
    - 保存失败静默重试 3 次后显示错误提示
    - 历史版本列表展示和回退功能
    - 需求引用：需求 2 验收标准 4-6

- [x] 15. 检查点 - 确保笔记和知识库前端页面基本可用

- [ ] 16. 实现跨模块标签系统
  - [ ] 16.1 实现 TagService 和 taggables 多态关联
    - 创建 `backend/src/services/TagService.ts`，封装标签 CRUD + 多态关联操作
    - 通过 `taggables` 表支持 notebook/note/note_page/folder/file 五种实体的标签关联
    - 实现按标签查询关联实体的功能
    - 需求引用：需求 11 验收标准 3-5
  - [ ] 16.2 实现标签 API 路由
    - 创建或扩展路由，支持标签的 CRUD 和按实体类型查询标签
    - AI 自动标签生成：上传文件和保存笔记页时调用问答模型生成标签建议
    - 需求引用：需求 8 验收标准 3-4
  - [ ] 16.3 实现前端标签管理组件
    - TagManager 组件：跨模块标签展示、筛选、创建、关联
    - 在笔记页编辑器和知识库文件详情中展示关联标签
    - 需求引用：需求 11 验收标准 4-5

- [ ] 17. 实现笔记与知识库互通
  - [ ] 17.1 实现引用关联 API
    - POST /api/notes/pages/:id/link-file：建立笔记页到知识库文件的引用（link 或 embed）
    - GET /api/knowledge-base/files/:id/refs：查询文件被哪些笔记页引用
    - 需求引用：需求 5 验收标准 1-4
  - [ ] 17.2 实现笔记页拖入知识库文件的前端交互
    - 在 TipTap 编辑器中注册自定义扩展，支持拖入知识库文件后生成引用链接
    - 点击引用链接跳转到知识库文件详情
    - 需求引用：需求 5 验收标准 1-2, 5
  - [ ] 17.3 实现笔记页导出为知识库 .md 文件
    - POST /api/notes/pages/:id/export-to-kb：将笔记页 HTML 内容转为 Markdown 并保存到指定知识库文件夹
    - 需求引用：需求 5 验收标准 3

- [ ] 18. 实现智能问答
  - [ ] 18.1 实现问答后端服务
    - 创建 `backend/src/services/QAService.ts`
    - 接收用户问题 → 在笔记页（关键词匹配）+ 知识库文件（向量检索）中检索相关内容
    - 将检索结果作为上下文传给问答大模型生成回答
    - 回答中标注引用来源（笔记页名称/文件名称 + 链接）
    - 需求引用：需求 9（智能问答）验收标准 1-5
  - [ ] 18.2 实现问答 API 路由
    - POST /api/qa/ask
    - 在 server.ts 中挂载 `/api/qa` 路由
  - [ ] 18.3 实现前端问答页面
    - QAInput：问题输入框 + 发送按钮
    - QAAnswer：回答展示区，引用来源可点击跳转
    - 处理中显示加载状态，无结果时友好提示
    - 需求引用：需求 9 验收标准 1-5

- [ ] 19. 实现全局搜索
  - [ ] 19.1 实现全局搜索后端 API
    - 扩展搜索路由，同时搜索笔记页（`plain_text`/`title` 关键词匹配）和知识库文件（向量相似度检索）
    - 结果按来源类型分组合并返回，标签名作为搜索命中属性
    - 需求引用：需求 10（笔记与知识库的搜索整合）验收标准 1-4
  - [ ] 19.2 实现前端全局搜索组件
    - GlobalSearch 组件：顶部搜索框，实时补全建议
    - 搜索结果按来源分组展示（笔记/知识库），可点击跳转
    - 需求引用：需求 10 验收标准 1-4

- [ ] 20. 实现 AI 笔记辅助功能
  - 在 TipTapEditor 中为选中文本添加 AI 辅助按钮（续写/摘要/润色/翻译）
  - 调用问答模型的 `chatComplete()` 方法，前端展示处理状态
  - 支持撤销回退到 AI 生成前的内容
  - 需求引用：需求 7（AI 笔记辅助）验收标准 1-6

- [x] 21. 实现前端模型设置页面
  - [x] SettingsPage 组件：按类别（问答/向量/重排序）分组展示 + 添加/编辑/删除/连通性测试 + 默认模型互斥
  - ModelManager 组件：按类别（问答/向量/重排序）使用 Tabs 切换分组
  - ModelConfigForm：添加/编辑模型配置表单（名称/类别/API地址/API Key/模型标识符/离线部署标记）
  - 连通性测试按钮，展示测试结果和耗时
  - 需求引用：需求 6 验收标准 1-5

- [ ] 22. 检查点 - 确保互通、问答、搜索功能完整可用

- [x] 23. 模板输出功能迁移
  - [x] OutputPage 组件：内容来源选择（笔记本/知识库文件）+ 模板下拉 + 自定义指令 + 生成结果展示
  - 将现有 `frontend/src/components/OutputPanel.tsx` 迁移为独立 `/output` 页面（OutputPage）

- [ ] 24. 清理旧前端入口
  - 将现有 `App.tsx` 中的知识片段列表、上传、搜索等旧 UI 移除（后端 API 保留用于存量数据）
  - 保留 FileUploader 和 SearchPanel 组件逻辑供知识库模块复用（不重复实现上传和搜索）
  - 需求引用：需求 11 验收标准 1-2
