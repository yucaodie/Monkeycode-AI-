# NoteTree & PageList 测试报告 & Bug 清单

生成日期: 2026-06-28

## 一、NoteTree 交互测试

### 1.1 正常态 — 图标 + 名称 + 计数 badge
- [ ] **测试**: 加载笔记本列表，验证每行显示图标+名称+数字
- [x] **通过** — `InlineEditableList.tsx:220-228` 渲染 count badge (`getCount={n => n.note_count}`), NoteTree 传入

### 1.2 悬停态 — 浅色背景 + 操作按钮淡入
- [ ] **测试**: 鼠标悬停笔记本行，检查背景色变化 + ✏️🗑 淡入; 鼠标离开后淡出
- [x] **通过** — `InlineEditableList.tsx:178-182` 背景切换, `HoverActions` opacity 过渡

### 1.3 选中态 — 深色背景 + 名称主色 + 操作保持可见
- [ ] **测试**: 单击笔记本，检查选中高亮背景 + 名称变主色 + ✏️🗑 保持可见
- [x] **通过** — `InlineEditableList.tsx:176-177,181` 选中样式 + `HoverActions visible=isSelected`

### 1.4 编辑态 — 输入框 + 操作隐藏 + Enter/blur 提交 + Esc 取消
- [ ] **测试**: 单击已选中项 → 输入框出现, ✏️🗑 隐藏; 输入新名称按 Enter → 提交; Esc → 恢复原名称; 点击外部 → 提交
- [x] **通过** — `InlineEditableList.tsx:199-221` 编辑输入框, `HoverActions` 根据 visible/disabled 隐藏
- [ ] **BUG**: `InlineEditableList.tsx:49-51` 编辑验证失败时调用 `list.setNewError(error)`，但 NewItemInput 只在 `adding=true` 时渲染（第150行），编辑态下错误无处展示。**后果**: 清空名称按 Enter，静默无反馈。

### 1.5 加载态 — 骨架屏 shimmer 动画
- [ ] **测试**: 首次加载或刷新时，显示 3 行灰色骨架屏闪烁
- [x] **通过** — `SkeletonList.tsx` 3 行 + shimmer keyframes
- [ ] **BUG**: `SkeletonList.tsx:11-17` `<style>` 内联注入，每次渲染累积 DOM 节点

### 1.6 空态 — 引导文案
- [ ] **测试**: 笔记本列表为空时显示"点击 + 创建笔记本"
- [x] **通过** — `InlineEditableList.tsx:261-268`

### 1.7 错误态 — 名称重复红色提示
- [ ] **测试**: 新建时输入已有名称按 Enter → 红色提示"同名笔记本已存在"; 重命名时同理
- [x] **通过(新建)** — `NewItemInput.tsx` 红色边框 + 错误文字
- [ ] **BUG(重命名)**: 同 1.4 — 编辑验证错误写入 `newNameError` 但编辑态不渲染 NewItemInput

---

### 1.8 单击未选中项 → 选中 + 加载笔记页
- [ ] **测试**: 单击未被选中的笔记本 → 右侧加载笔记页
- [x] **通过** — `InlineEditableList.tsx:170` `props.onSelect(id)`

### 1.9 单击已选中项 → 进入内联重命名
- [ ] **测试**: 单击已高亮的笔记本 → 进入编辑态
- [x] **通过** — `InlineEditableList.tsx:169` `if (isSelected) list.startEdit(id, name)`

### 1.10 双击任意项 → 进入内联重命名
- [ ] **测试**: 双击任意笔记本 → 进入编辑态
- [x] **通过** — `InlineEditableList.tsx:172-174`

### 1.11 重命名提交 → 乐观更新 + API 失败回滚
- [ ] **测试**: 重命名提交 → 名称立即更新; 模拟 API 失败 → 名称回滚
- [ ] **缺失** — `NoteTree.tsx:39-45` `onRename` 先调 API 再更新 setItems，未乐观更新。应先 `setItems(prev => ...)` 再 `await API`，失败则回滚。

### 1.12 删除按钮 → 自定义确认 → 确认后删除 + deselect
- [ ] **测试**: 点击删除 → 弹出对话框; 确认 → 删除 + 清除选中; 取消 → 恢复
- [x] **通过** — `DeleteConfirmDialog` + `NoteTree.tsx:48-53`

### 1.13 新建按钮 → 顶部输入框 → Enter 创建 → note_count=0
- [ ] **测试**: 点击 + → 顶部输入框出现; 输入名称 Enter → 创建成功插入顶部, 计数 0
- [x] **通过** — `InlineEditableList.tsx:148-157` NewItemInput + `NoteTree.tsx:55-60`

### 1.14 名称重复校验
- [ ] **测试**: 输入已有名称 → 错误提示; 空值/仅空白 → 不提交
- [x] **通过** — `NoteTree.tsx:62-66` validateName

### 1.15 背景色切换 150ms ease
- [ ] **测试**: 悬停/选中项时背景切换有过渡
- [x] **通过** — `InlineEditableList.tsx:180` `transition: 'background 0.15s ease'`

### 1.16 操作按钮淡入淡出 100ms opacity
- [ ] **测试**: 悬停时按钮淡入 100ms, 离开时淡出
- [x] **通过** — `HoverActions.tsx:26` `transition: 'opacity 0.1s ease'`

### 1.17 键盘导航 ↑↓ Enter F2 Delete Esc
- [ ] **测试**: 聚焦列表容器, ↑↓ 移动焦点, Enter 选中, F2 重命名, Delete 弹出确认, Esc 取消编辑
- [x] **通过** — `useKeyboardNav.ts`
- [ ] **BUG**: `useKeyboardNav.ts:23-27` 容器每次获焦重置 `focusedIndex=0`，之前导航丢失
- [ ] **缺失**: `Home`/`End` 键支持

---

### 1.18 数量实时联动
- [ ] **测试**: 在 Workspace 创建/删除笔记页 → NoteTree 笔记本计数更新
- [ ] **BUG**: `NavigationContext.tsx:38-43` `SELECT_NOTE` reducer **丢失了 `notebooksVersion`**
  ```
  notes: { selectedNoteId: action.noteId, selectedPageId: null }
  // 应该是：
  notes: { ...state.notes, selectedNoteId: action.noteId, selectedPageId: null }
  ```
  导致 notebooksVersion 变为 undefined，NoteTree reload 逻辑异常。

- [ ] **BUG**: `NavigationContext.tsx:45-49` `DESELECT_NOTE` 同上有同样问题

---

## 二、PageList 交互测试

### 2.1 正常态 — 图标 + 标题（无计数）
- [ ] **测试**: 加载笔记页列表，每行显示图标+标题
- [x] **通过**

### 2.2 悬停态 — 浅色背景 + 操作淡入
- [ ] **测试**: 同 NoteTree
- [x] **通过**

### 2.3 选中态 — 深色背景 + 标题加粗 + 操作可见
- [ ] **BUG/缺失**: `InlineEditableList` 中选中项没有独立的标题加粗逻辑。NoteTree 通过 `isSelected` 切换颜色，但 font-weight 未变。
- [ ] **测试**: 选中笔记页后标题是否变 bold (vs 非选中 `var(--font-weight-normal)`)

### 2.4 编辑态 — 同 NoteTree
- [ ] **测试**: 同 1.4
- [ ] **BUG**: 同 1.4 — 编辑验证错误无处展示

### 2.5 加载态 — 骨架屏
- [ ] **测试**: 切换笔记本时显示骨架屏
- [x] **通过**

### 2.6 空态 — 引导文案
- [ ] **测试**: 空笔记本显示"点击 + 创建笔记页"
- [x] **通过**

### 2.7 错误态 — 内联重复提示
- [ ] **BUG**: 同 NoteTree 1.4/1.7 — 编辑验证错误在编辑态不展示

---

### 2.8 单击未选中项 → 选中 + 加载编辑器
- [ ] **测试**: 单击笔记页 → 右侧加载 TipTapEditor
- [x] **通过**

### 2.9 单击已选中项 → 进入重命名
- [ ] **测试**: 单击已选中页 → 编辑态
- [x] **通过**

### 2.10 重命名提交 → 乐观更新 + 失败回滚
- [ ] **测试**: 输入新标题 Enter → 标题立即更新 + API 同步
- [x] **通过** — `NotesWorkspace.tsx:139-148` `handleRenamePage`

### 2.11 删除按钮 → 确认对话框 → 删除 + 清除选中 + refreshNotebooks
- [ ] **测试**: 删除笔记页 → 从列表移除 + 清除选中 + NoteTree 计数更新
- [x] **通过** — `NotesWorkspace.tsx:150-157` `handleDeletePage`

### 2.12 新建按钮 → 自动创建笔记 + 去重递增标题 + refreshNotebooks
- [ ] **测试**: 空笔记本中新建 → 自动创建"新笔记" → 创建"新笔记页"; 再新建 → "新笔记页2"
- [x] **通过** — `NotesWorkspace.tsx:91-137` `handleCreatePage`

### 2.13 标题去重同 noteId
- [ ] **测试**: 同 noteId 下创建同名页 → 递增
- [x] **通过**

### 2.14 键盘导航
- [ ] **测试**: 同 NoteTree
- [ ] **BUG**: 同 NoteTree — focusedIndex 重置问题

---

## 三、全局 BUG 清单

### 严重 (P0 — 功能性故障)

| # | 文件:行 | 描述 |
|---|---------|------|
| B1 | `NavigationContext.tsx:38-43` | SELECT_NOTE 丢失 notebooksVersion，导致 NoteTree 计数联动失效 |
| B2 | `NavigationContext.tsx:45-49` | DESELECT_NOTE 丢失 notebooksVersion |
| B3 | `InlineEditableList.tsx:49-51` + `InlineEditableList.tsx:150` | 编辑验证错误写入 newNameError，但 NewItemInput 仅在 adding 时渲染，编辑态错误静默丢失 |

### 中等 (P1 — UX 缺陷)

| # | 文件:行 | 描述 |
|---|---------|------|
| B4 | `NoteTree.tsx:39-45` | onRename 未实现乐观更新（先调 API 再 setItems） |
| B5 | `DeleteConfirmDialog.tsx:17-21` + `DeleteConfirmDialog.tsx:59` | Enter 键双重触发 onConfirm（overlay onKeyDown + 按钮 autoFocus onClick） |
| B6 | `NotesWorkspace.tsx:71-83` | handleContentChange 中 timer 使用闭包 selectedPage，跨页内容可能污染 |
| B7 | `NotesWorkspace.tsx:91-137` | handleCreatePage 中 createNote 成功但 createPage 失败时，产生空笔记孤儿 |
| B8 | `NewItemInput.tsx:30` | onBlur={onCancel} 会丢弃已输入内容（应仅空值取消） |
| B9 | `useKeyboardNav.ts:23-27` | 容器每次获焦 reset focusedIndex=0，破坏已有导航状态 |
| B10 | `DeleteConfirmDialog.tsx:57-71` | 删除按钮无 loading 状态，可快速双击触发两次删除 |
| B11 | `InlineEditableList.tsx:251-253` | HoverActions disabled 始终 false，renaming 期间可触发删除竞态 |

### 低 (P2 — 非阻塞)

| # | 文件:行 | 描述 |
|---|---------|------|
| B12 | `SkeletonList.tsx:11-17` | `<style>` 内联导致每次渲染累积 DOM 节点 |
| B13 | `NoteTree.tsx:22` | `.reverse()` 忽略 sort_order 字段 |
| B14 | `NoteTree.tsx:23` + `NotesWorkspace.tsx:57` | 加载失败静默吞错，无错误状态展示 |
| B15 | `useKeyboardNav.ts:36-76` | 缺少 Home/End 键支持 |
| B16 | `NewItemInput.tsx:26-29` | Enter/Escape 未 preventDefault，在 form 内可能触发提交 |
| B17 | `InlineEditableList.tsx:35` | useEditableListReducer 每次渲染创建新 config 对象，导致多余 dispatch |

### 无障碍 (P2)

| # | 文件:行 | 描述 |
|---|---------|------|
| A1 | `InlineEditableList.tsx:143,171` | 列表容器非 `<ul>/<ol>`，列表项无 `role="listitem"` |
| A2 | `InlineEditableList.tsx:201-222` | 编辑 input 缺少 aria-label |
| A3 | `DeleteConfirmDialog.tsx:11-74` | 对话框非 `<dialog>` 元素，无 aria-modal, 无焦点陷阱 |
| A4 | `HoverActions.tsx:33,39` | 按钮缺少 aria-label |
| A5 | `SkeletonList.tsx` | 骨架屏缺少 aria-busy/role="status" |

---

## 四、设计不完备项（非 bug，但交互缺失）

| # | 描述 |
|---|------|
| D1 | PageList 选中项没有标题加粗效果（checklist 2.3 要求） |
| D2 | 新建输入框无滑入动画（checklist 要求 150ms max-height + opacity），当前直接 appear |
| D3 | NoteTree 未展示错误状态（加载失败后的 UI 反馈） |
| D4 | PageList 无重新排序能力（Notion/Linear 对标均有拖拽排序） |
| D5 | 删除后无撤销 Toast（Notion 对标有 Undo） |
| D6 | 列表项无右键上下文菜单 |
