# Requirements Document

## Introduction

对现有 AI 知识助手前端进行全面 UI 优化：建立设计系统（色彩/间距/排版 CSS 变量）、重构侧边栏布局（功能导航 + 底部用户/设置区）、实现响应式三栏布局（知识库和笔记模块）、消除内联样式硬编码。

## Glossary

- **设计令牌 (Design Tokens)**：CSS 自定义属性（变量），统一管理颜色、间距、字号、圆角等视觉参数
- **侧边栏 (Sidebar)**：应用最左侧固定导航栏，包含功能入口和底部用户/设置区域
- **三栏布局**：知识库页面的文件夹列表 -> 文件列表 -> 内容预览，笔记页面的笔记树 -> 编辑器 -> 笔记页列表
- **响应式断点**：预定义的屏幕宽度阈值，界面在不同断点下切换布局模式
- **主题**：亮色/暗色两套视觉方案，通过 CSS 变量切换

## Requirements

### 1. 设计系统 - 色彩主题

**User Story:** AS 用户，I want 一致且可切换的明暗色彩主题，so that 在所有页面中视觉体验统一、眼睛舒适

#### Acceptance Criteria

1. The 系统 SHALL 在 `index.css` 的 `:root` 中定义完整的设计令牌 CSS 变量，涵盖：主色、辅色、背景、边框、文字（3 级灰度）、状态色（成功/警告/危险）、阴影、圆角、间距阶梯
2. The 系统 SHALL 同时定义亮色主题（`:root`）和暗色主题（`[data-theme="dark"]` 或 `@media (prefers-color-scheme: dark)`）两套令牌值
3. The 系统 SHALL 将 Sidebar 背景色 `#1a1a2e` 替换为设计令牌变量，Sidebar 内所有颜色统一通过令牌引用
4. The 系统 SHALL 将内容区背景色 `#fafafa`、边框色 `#e0e0e0` 等所有硬编码颜色替换为设计令牌引用
5. The 系统 SHALL 定义操作主色和交互状态色（hover/active/disabled），并统一应用到按钮、链接、选中态

---

### 2. 设计系统 - 间距与排版

**User Story:** AS 用户，I want 统一的间距和排版节奏，so that 各页面组件对齐一致、信息层次清晰

#### Acceptance Criteria

1. The 系统 SHALL 定义 6 级间距阶梯（xs/sm/md/lg/xl/2xl），对应内边距、外边距、组件间隙
2. The 系统 SHALL 定义 5 级排版层级（h1/h2/h3/body/small），包含字号、字重、行高
3. The 系统 SHALL 将所有组件中硬编码的 padding、margin、gap 值替换为间距令牌引用
4. The 系统 SHALL 将所有组件中硬编码的 fontSize 替换为排版令牌引用

---

### 3. 侧边栏 - 功能导航区（含内嵌树形导航）

**User Story:** AS 用户, I want 侧边栏包含完整的功能导航入口并内嵌笔记树和知识库文件夹树, so that 无需跳转页面即可浏览和选择内容

#### Acceptance Criteria

1. The 侧边栏 SHALL 按功能分组展示导航项：
   - 内容管理组：「笔记 & 知识库」（合并入口，点击展开为上下两个树形区域：上方笔记树、下方知识库文件夹树）
   - AI 工具组：智能问答、模板输出
   - 系统配置组：模型设置
2. WHEN 用户点击「笔记 & 知识库」入口，系统 SHALL 展开显示上方的笔记树（笔记本 > 笔记）和下方的知识库文件夹树（文件夹 > 文件），两个树形区域各占用展开区域的一半高度，中间有拖拽分隔线
3. WHEN 用户在笔记树中点击笔记节点，系统 SHALL 在右侧主区域展示该笔记下的笔记页列表和编辑器
4. WHEN 用户在知识库文件夹树中点击文件夹，系统 SHALL 在右侧主区域展示该文件夹下的文件列表和预览
5. WHEN 用户点击侧边栏中其他导航项（智能问答/模板输出/模型设置），系统 SHALL 在右侧主区域渲染对应页面
6. The 侧边栏 SHALL 在顶部显示应用 Logo 和名称

---

### 4. 侧边栏 - 底部用户与设置区

**User Story:** AS 用户，I want 侧边栏底部提供用户登录入口和系统设置快捷操作，so that 管理账号和系统配置无需离开当前页面

#### Acceptance Criteria

1. The 侧边栏底部 SHALL 常驻显示：
   - 用户头像/登录按钮（未登录时显示"登录"文字按钮，已登录显示头像 + 用户名）
   - 设置齿轮图标按钮（跳转到 `/settings` 页面）
2. WHEN 用户点击用户区域（已登录），系统 SHALL 弹出下拉菜单：个人信息、API Key 管理、退出登录
3. The 侧边栏底部 SHALL 显示应用版本号
4. The 侧边栏 SHALL 在内容溢出时保持底部区域固定在视口底部，中间导航区可滚动

---

### 5. 侧边栏 - 折叠与响应式

**User Story:** AS 用户，I want 侧边栏支持折叠以释放屏幕空间，so that 在小屏设备上获得更多内容展示区域

#### Acceptance Criteria

1. The 侧边栏 SHALL 在顶部/底部提供折叠/展开按钮
2. WHEN 侧边栏折叠，系统 SHALL 收起为 60-64px 宽，仅显示图标，hover 时显示 tooltip
3. WHILE 屏幕宽度 < 768px，系统 SHALL 默认折叠侧边栏
4. WHILE 屏幕宽度 < 768px，系统 SHALL 支持点击遮罩层关闭展开的侧边栏
5. The 侧边栏折叠状态 SHALL 通过 localStorage 持久化

---

### 6. 知识库模块 - 右侧双栏预览布局

**User Story:** AS 用户，I want 在侧边栏选中知识库文件夹后右侧展示文件列表和预览，so that 高效浏览文件内容

#### Acceptance Criteria

1. WHEN 用户在侧边栏知识库文件夹树中选中文件夹，系统 SHALL 在右侧主区域展示双栏布局：左侧文件列表（280px）+ 右侧内容预览（剩余宽度）
2. The 文件列表 SHALL 支持文件上传、重命名、删除操作
3. WHEN 用户点击文件列表中的文件，系统 SHALL 在预览区渲染文件内容（.md 用 Markdown 渲染，.docx/.pdf 用只读预览，图片直接展示）
4. The 双栏 SHALL 支持用户拖拽中间分隔线调整比例
5. WHILE 屏幕宽度 < 768px，系统 SHALL 将双栏合并为单栏，文件列表在顶部，点击文件后跳转到全屏预览
6. The 文件面板内部滚动，右侧整体页面不产生多余滚动条

---

### 7. 笔记模块 - 右侧双栏编辑布局

**User Story:** AS 用户，I want 在侧边栏选中笔记后右侧展示笔记页列表和富文本编辑器，so that 方便地浏览和编辑笔记

#### Acceptance Criteria

1. WHEN 用户在侧边栏笔记树中选中笔记，系统 SHALL 在右侧主区域展示双栏布局：左侧笔记页列表（200px）+ 右侧富文本编辑器（剩余宽度）
2. The 笔记页列表 SHALL 支持创建、重命名、删除笔记页
3. WHEN 用户点击笔记页列表中的笔记页，系统 SHALL 在编辑器中加载该笔记页内容
4. The 双栏 SHALL 支持用户拖拽中间分隔线调整比例
5. WHILE 屏幕宽度 < 768px，系统 SHALL 将双栏合并为单栏全屏编辑器
6. The 编辑器区域内部滚动，右侧整体页面不产生多余滚动条

---

### 8. 组件样式统一

**User Story:** AS 开发者，I want 所有组件使用统一的设计令牌和样式模式，so that 代码维护成本低、视觉一致性好

#### Acceptance Criteria

1. The 系统 SHALL 将所有组件内的内联 style 对象中的颜色值替换为 `var(--xxx)` 引用
2. The 系统 SHALL 将所有组件内的内联 style 对象中的间距值替换为 `var(--space-xxx)` 引用
3. The 系统 SHALL 提取公共按钮样式为可复用的样式常量或 CSS 类
4. The 系统 SHALL 提取公共输入框样式为可复用的样式常量或 CSS 类
5. The 系统 SHALL 将侧边栏样式从内联迁移到独立的 Sidebar.css 文件并引用设计令牌

---

### 9. 全局布局 - 视口适配

**User Story:** AS 用户，I want 应用界面填满视口且无多余滚动条，so that 最大化利用屏幕空间

#### Acceptance Criteria

1. The 根布局 SHALL 使用 `height: 100vh`（或 `100dvh`）填满视口
2. The 根容器 `#root` 的 `width: 1126px; margin: 0 auto;` 限制 SHALL 被移除，允许全宽显示
3. The 主内容区 SHALL 设置 `overflow: auto` 确保内容超出时内部滚动
4. The 页面级别滚动 SHALL 仅发生在各面板内部，整体页面不产生全局滚动条

---

## References

- 现有设计文档：`.monkeycode/specs/ai-notes-knowledge-base/design.md`
- 现有需求文档：`.monkeycode/specs/ai-notes-knowledge-base/requirements.md`
- 前端入口样式：`frontend/src/index.css`
- 侧边栏组件：`frontend/src/components/Sidebar.tsx`
- 布局组件：`frontend/src/components/Layout.tsx`
