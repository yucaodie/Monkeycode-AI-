# AI Notes + Knowledge Base

一个基于 React 的 AI 知识助手前端应用，提供笔记管理和知识库两大功能模块。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **编辑器**: TipTap (基于 ProseMirror)
- **测试**: Vitest + @testing-library/react
- **样式方案**: CSS 变量设计令牌 + 行内样式

## 已实现功能 (V0.1)

### 三栏布局

- **侧边栏** (240px): 扁平导航，4 个 NavItem — 笔记&知识库、智能问答、模板输出、模型设置
- **TreePanel** (280px): 第二列面板，仅在笔记/知识库视图显示
  - 上: 笔记本列表 (NoteTree)
  - 下: 知识库文件夹列表 (FolderList)
  - 上下 50/50 可拖拽分栏
- **内容区**: 动态视图渲染，根据导航状态切换不同工作区

### 笔记模块

- 笔记本 CRUD (新建/重命名/删除)
- 点击笔记本 → 右侧展示所有笔记页列表
- 笔记页选择 + TipTap 富文本编辑器
- 自动保存 (2 秒防抖)

### 知识库模块

- 文件夹 CRUD
- 文件上传到文件夹
- 文件列表展示 + 预览

### 分栏拖拽

- 8px 可视拖动线 + 12px 热区
- 移入热区: 游标变 resize + 蓝条高亮
- 按住拖动调整比例
- 双击复位 50/50
- 比例自动保存到 localStorage

### 设计令牌

- 40+ CSS 变量: 颜色、间距、圆角、阴影、字体
- 统一 styles.ts 共享样式工具
- 侧边栏响应式适配 (< 768px 折叠)

## 开发

```bash
# 安装依赖
cd frontend && npm install

# 启动开发服务器
cd frontend && npm run dev

# 构建
cd frontend && npm run build

# 测试
cd frontend && npx vitest run
```
