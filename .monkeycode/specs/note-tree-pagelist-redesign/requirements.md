# Requirements Document — NoteTree & PageList 交互重设计

## 引言

重设计笔记树（NoteTree）和笔记页列表（PageList），使其达到企业级严肃交付水平。对标 VS Code 文件浏览器、Notion 侧边栏、Linear 侧边栏的交互规范，覆盖所有状态（正常/悬停/选中/编辑/空/加载/错误）和所有动作（新建/重命名/删除/选择），确保键盘可导航、过渡动画自然、数量实时联动。

## 术语表

- **笔记本 (Notebook)**: 顶层分组容器，包含多个笔记 (Note)
- **笔记 (Note)**: 笔记本内的分组，包含多个笔记页 (Page)
- **笔记页 (Page)**: 最小可编辑单元，隶属某个笔记
- **NoteTree**：左侧面板的笔记本平铺列表
- **PageList**：笔记工作区左侧面板的笔记页平铺列表
- **乐观更新 (Optimistic Update)**: 先更新 UI，再确认 API 返回，失败时回滚
- **去重递增**: 自动生成名称时检测重名并追加数字后缀（如"新笔记页"→"新笔记页2"→"新笔记页3"）

## 需求

### R1: 悬停操作按钮交互

**User Story:** AS 用户, I want 鼠标悬停时看到可用的操作按钮, so that 我能快速执行重命名和删除，且正常浏览时界面保持简洁。

#### Acceptance Criteria

1. WHEN 鼠标悬停在列表项上，THE 列表项 SHALL 显示浅色背景高亮。
2. WHEN 鼠标悬停在列表项上，THE 操作按钮组 SHALL 以 opacity 0→1 过渡（约 100ms）淡入显示。
3. WHEN 鼠标离开列表项，THE 操作按钮组 SHALL 以 opacity 1→0 过渡淡出隐藏。
4. WHEN 列表项处于编辑态，THE 操作按钮 SHALL 自动隐藏。
5. 操作按钮组 SHALL 包含重命名按钮和删除按钮，两者之间留有 4px 间距。

---

### R2: 内联重命名交互

**User Story:** AS 用户, I want 单击已选中项或双击任意项进入内联重命名, so that 我能快速修改名称而无需弹出对话框。

#### Acceptance Criteria

1. WHEN 用户单击已选中的列表项，THE 该项 SHALL 进入内联编辑态，显示文本输入框。
2. WHEN 用户双击未选中的列表项，THE 该项 SHALL 进入内联编辑态。
3. WHEN 用户按下 Enter 键，THE 系统 SHALL 提交新名称并退出编辑态。
4. WHEN 用户按下 Escape 键，THE 系统 SHALL 取消编辑，恢复原名称。
5. WHEN 输入框失去焦点 (blur)，THE 系统 SHALL 提交新名称并退出编辑态。
6. IF 新名称为空或仅含空白字符，THE 系统 SHALL 取消编辑，不提交。
7. IF 新名称与同级其他项重名，THE 系统 SHALL 显示内联错误提示"同名已存在"，不提交。
8. WHEN 提交成功，THE 系统 SHALL 乐观更新列表：立即在本地更新名称，保留其他字段（如 note_count）。

---

### R3: 删除交互

**User Story:** AS 用户, I want 通过悬停按钮删除列表项并获得确认, so that 我能安全地删除不需要的内容。

#### Acceptance Criteria

1. WHEN 用户点击删除按钮，THE 系统 SHALL 显示自定义确认对话框（非浏览器原生 confirm）。
2. 确认对话框 SHALL 列出即将删除的项名称。
3. 确认对话框 SHALL 包含"取消"和"删除"两个按钮。
4. WHEN 用户点击"删除"，THE 系统 SHALL 发送删除请求并从列表中立即移除该项。
5. WHEN 被删除的笔记本处于选中状态，THE 系统 SHALL 自动清除选中状态（DESELECT_NOTE）。
6. WHEN 被删除的笔记页处于选中状态，THE 系统 SHALL 自动清除选中状态（SELECT_PAGE null）。
7. WHEN 删除笔记页完成，THE 系统 SHALL 触发 refreshNotebooks 以更新 NoteTree 中的笔记计数。

---

### R4: 新建项交互

**User Story:** AS 用户, I want 通过顶部按钮创建新的笔记本或笔记页, so that 我能快速扩展内容结构。

#### Acceptance Criteria

1. WHEN 用户点击新建按钮，THE 系统 SHALL 在列表顶部显示内联输入框。
2. 内联输入框 SHALL 自动获取焦点，placeholder 为"笔记本名称"（NoteTree）或"笔记页标题"（PageList）。
3. WHEN 用户按下 Enter 键，THE 系统 SHALL 验证名称非空且无重名后创建新项。
4. WHEN 用户按下 Escape 键或点击外部区域，THE 系统 SHALL 取消新建，隐藏输入框。
5. IF 名称为空或仅含空白字符，THE 系统 SHALL 取消新建。
6. IF 名称与已有项重复，THE 系统 SHALL 在输入框下方显示"同名已存在"错误提示（不创建）。
7. WHEN 创建成功，THE 新项 SHALL 插入列表顶部，带临时笔记计数 0（NoteTree）。
8. WHEN 在空笔记本中创建首个笔记页，THE 系统 SHALL 自动创建笔记后再创建页面，去重递增命名。
9. WHEN 笔记页创建成功，THE 系统 SHALL 触发 refreshNotebooks 更新笔记本计数。

---

### R5: 选择交互

**User Story:** AS 用户, I want 单击列表项来选择并加载对应内容, so that 我能清晰知道当前操作的是哪个项。

#### Acceptance Criteria

1. WHEN 用户单击未选中的列表项，THE 系统 SHALL 选中该项并触发右侧内容加载。
2. 选中项 SHALL 显示高亮背景色，名称颜色切换为主色。
3. 选中项的操作按钮 SHALL 保持可见（不受悬停淡入规则约束）。
4. WHEN 选中不同的项，THE 前一个选中项 SHALL 恢复默认样式。

---

### R6: 笔记本笔记数量实时显示

**User Story:** AS 用户, I want 每个笔记本始终显示其包含的笔记数量, so that 我能快速评估内容分布。

#### Acceptance Criteria

1. 每个笔记本行 SHALL 始终显示笔记数量（包括 0）。
2. 数量 badge SHALL 显示在笔记本名称右侧，字体略小，颜色淡化。
3. WHEN 笔记页被创建或删除，THE 对应笔记本的数量 SHALL 通过 notebooksVersion 机制自动刷新。

---

### R7: 编辑态切换自动清除

**User Story:** AS 用户, I want 切换到不同项时自动退出编辑态, so that 不会出现编辑框错位到错误项的 bug。

#### Acceptance Criteria

1. WHEN selectedNoteId 变化且不等于当前编辑的 ID，THE 编辑态 SHALL 自动清除。
2. WHEN selectedPageId 变化且不等于当前编辑的 ID，THE 编辑态 SHALL 自动清除。

---

### R8: 键盘导航

**User Story:** AS 用户, I want 用键盘上下箭头导航列表项, so that 能手不离键盘高效操作。

#### Acceptance Criteria

1. 列表容器 SHALL 支持 tabIndex={0} 获取键盘焦点。
2. WHEN 用户按下 ↑ 键，焦点 SHALL 移动到上一个列表项。
3. WHEN 用户按下 ↓ 键，焦点 SHALL 移动到下一个列表项。
4. WHEN 用户按下 Enter 键（有焦点项），THE 该项 SHALL 被选中。
5. WHEN 用户按下 F2 键（有焦点项），THE 该项 SHALL 进入内联重命名。
6. WHEN 用户按下 Delete 键（有焦点项），THE 系统 SHALL 触发删除确认流程。
7. WHEN 用户按下 Escape 键（编辑或新建态），THE 当前编辑/新建 SHALL 被取消。

---

### R9: 加载和空状态

**User Story:** AS 用户, I want 加载中和无数据时有清晰的视觉反馈, so that 我不会困惑于当前状态。

#### Acceptance Criteria

1. WHILE 列表正在加载，THE 系统 SHALL 显示骨架屏（3 个灰色占位块，带闪烁动画）。
2. WHEN 列表加载完成且项数为 0，THE 系统 SHALL 显示引导文案和新建按钮。
3. WHEN 新建输入框可见，THE 空状态引导 SHALL 自动隐藏。

---

### R10: 过渡动画

**User Story:** AS 用户, I want 状态变化有平滑过渡, so that 界面交互自然流畅。

#### Acceptance Criteria

1. 列表项背景色切换 SHALL 使用 150ms ease 过渡。
2. 悬停操作按钮 SHALL 使用 100ms opacity 过渡淡入/淡出。
3. 新建输入框 SHALL 使用 150ms max-height + opacity 过渡滑入/滑出。
4. 列表项插入/删除 SHALL 即时更新，无动画。

---

### R11: 页面标题去重递增

**User Story:** AS 用户, I want 新建笔记页自动生成不重复的标题, so that 不会产生同名困惑。

#### Acceptance Criteria

1. WHEN 在同一笔记下新建页面且"新笔记页"已存在，THE 标题 SHALL 自动递增为"新笔记页2"。
2. 去重逻辑 SHALL 仅检查同一 noteId 下的页面标题。

---

## 参考研究

来源：VS Code 文件浏览器、Notion 侧边栏、Linear 侧边栏。

| 交互模式       | 对标来源          | 设计决策                                                                 |
|----------------|-------------------|--------------------------------------------------------------------------|
| 选中态 + 加载  | Notion             | 单击选中并加载内容，侧边栏高亮                                          |
| 内联重命名     | Notion + VS Code   | 单击已选中项或双击任意项进入编辑，Enter/Esc/blur 提交/取消              |
| 悬停操作按钮   | Linear             | opacity 淡入淡出，正常状态按钮隐藏                                      |
| 删除确认       | Linear             | 自定义确认对话框（内联确认文字 + 按钮），非浏览器原生 confirm           |
| 新建位置       | VS Code            | 列表顶部出现输入框，Enter 创建后插入顶部                                |
| 数量 badge     | Linear             | 始终显示计数，字体小 + 颜色淡化                                        |
| 键盘导航       | VS Code            | ↑↓ 导航 + Enter 选择 + F2 重命名 + Delete 删除                          |
| 空状态引导     | Notion + Linear    | 1 个引导文案 + 新建按钮                                                 |
| 骨架屏加载     | Linear             | 灰色占位块带闪烁动画                                                    |
| 旧值回滚       | Notion             | 重命名乐观更新：先改 UI，API 失败则恢复原值                            |
