import { useState, useEffect, useCallback } from 'react';
import notesService, { type TreeNode } from '../../services/notesService';

interface Props {
  onSelectPage: (pageId: number) => void;
}

interface ContextMenu {
  x: number;
  y: number;
  node: TreeNode;
}

interface DragData {
  node: TreeNode;
  parentId: number | null;
}

export default function NoteTree({ onSelectPage }: Props) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menu, setMenu] = useState<ContextMenu | null>(null);

  const load = useCallback(async () => {
    try { setTree(await notesService.getTree()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleExpand(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleSelect(node: TreeNode) {
    if (node.type === 'page') {
      setSelectedId(node.id);
      onSelectPage(node.id);
    } else {
      toggleExpand(node.type + '_' + node.id);
    }
  }

  function handleContextMenu(e: React.MouseEvent, node: TreeNode) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, node });
  }

  async function handleCreateChild(parent: TreeNode) {
    setMenu(null);
    if (parent.type === 'notebook') {
      await notesService.createNote(parent.id, '新笔记');
    } else if (parent.type === 'note') {
      const page = await notesService.createPage(parent.id, '新笔记页');
      onSelectPage(page.id);
    }
    load();
  }

  async function handleDelete(node: TreeNode) {
    setMenu(null);
    if (!confirm(`确定删除「${node.name}」？`)) return;
    if (node.type === 'notebook') await notesService.deleteNotebook(node.id);
    else if (node.type === 'note') await notesService.deleteNote(node.id);
    else await notesService.deletePage(node.id);
    if (node.type === 'page' && selectedId === node.id) setSelectedId(null);
    load();
  }

  function startRename(node: TreeNode) {
    setMenu(null);
    setEditingId(node.type + '_' + node.id);
    setEditName(node.name);
  }

  async function finishRename(node: TreeNode) {
    const name = editName.trim();
    if (name && name !== node.name) {
      if (node.type === 'notebook') await notesService.updateNotebook(node.id, { name });
      else if (node.type === 'note') await notesService.updateNote(node.id, { name });
      else await notesService.updatePage(node.id, { title: name });
      load();
    }
    setEditingId(null);
  }

  function handleDragStart(e: React.DragEvent, node: TreeNode, parentId: number | null) {
    const data: DragData = { node, parentId };
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e: React.DragEvent, target: TreeNode, targetParentId: number | null) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const { node: source, parentId: sourceParentId } = JSON.parse(raw) as DragData;
    if (source.id === target.id) return;

    // Same-level reorder: same type + same parent
    if (source.type === target.type && source.type !== 'notebook' && sourceParentId === targetParentId) {
      // Reorder within same parent: move source right after target
      if (source.type === 'page') {
        notesService.updatePage(source.id, { sort_order: target.id * 10 + 5 }).then(load).catch(console.error);
      } else if (source.type === 'note') {
        notesService.updateNote(source.id, { sort_order: target.id * 10 + 5 }).then(load).catch(console.error);
      }
      return;
    }

    // Cross-level move
    if (source.type === 'page' && target.type === 'note' && source.id !== target.id) {
      notesService.updatePage(source.id, { note_id: target.id }).then(load).catch(console.error);
    } else if (source.type === 'note' && target.type === 'notebook' && source.id !== target.id) {
      notesService.updateNote(source.id, { notebook_id: target.id }).then(load).catch(console.error);
    }
  }

  function renderNode(node: TreeNode, depth: number, parentId: number | null) {
    const key = node.type + '_' + node.id;
    const isExpanded = expanded.has(key);
    const isSelected = node.type === 'page' && selectedId === node.id;
    const isEditing = editingId === key;
    const isBranch = node.type !== 'page';
    const padLeft = 12 + depth * 16;

    let onDragOver: React.DragEventHandler | undefined;
    if (isBranch) {
      onDragOver = e => e.preventDefault();
    } else if (node.type === 'page') {
      onDragOver = e => e.preventDefault();
    }

    return (
      <div key={key}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            paddingLeft: padLeft + 'px',
            cursor: 'pointer',
            background: isSelected ? '#e6f7f5' : 'transparent',
            borderRadius: '4px',
            margin: '1px 4px',
            userSelect: 'none',
          }}
          onClick={() => handleSelect(node)}
          onContextMenu={e => handleContextMenu(e, node)}
          draggable
          onDragStart={e => handleDragStart(e, node, parentId)}
          onDragOver={onDragOver}
          onDrop={e => handleDrop(e, node, parentId)}
        >
          <span style={{
            width: '16px', fontSize: '10px', color: '#999',
            visibility: isBranch ? 'visible' : 'hidden',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }}>▶</span>

          <span style={{ marginRight: '6px', fontSize: '14px' }}>
            {node.type === 'notebook' ? '📓' : node.type === 'note' ? '📝' : '📄'}
          </span>

          {isEditing ? (
            <input
              autoFocus
              style={{
                flex: 1, border: '1px solid #4ecdc4', borderRadius: '3px',
                padding: '1px 4px', fontSize: '13px', outline: 'none',
              }}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => finishRename(node)}
              onKeyDown={e => { if (e.key === 'Enter') finishRename(node); if (e.key === 'Escape') setEditingId(null); }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span style={{
              fontSize: node.type === 'notebook' ? '14px' : '13px',
              fontWeight: node.type === 'notebook' ? 600 : node.type === 'note' ? 500 : 400,
              color: node.type === 'page' ? '#555' : '#222',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {node.name}
            </span>
          )}
        </div>

        {isBranch && isExpanded && node.children?.map((child, i) => renderNode(child, depth + 1, node.id))}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: '#444' }}>笔记</span>
        <button
          title="新建笔记本"
          onClick={async () => { await notesService.createNotebook('新笔记本'); load(); }}
          style={{
            width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px',
            background: '#fff', cursor: 'pointer', fontSize: '14px', lineHeight: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {tree.map(node => renderNode(node, 0, null))}
        {tree.length === 0 && (
          <div style={{ padding: '20px', color: '#999', fontSize: '13px', textAlign: 'center' }}>
            点击 + 创建第一个笔记本
          </div>
        )}
      </div>

      {menu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setMenu(null)}
            onContextMenu={e => { e.preventDefault(); setMenu(null); }}
          />
          <div style={{
            position: 'fixed', left: menu.x, top: menu.y, zIndex: 100,
            background: '#fff', border: '1px solid #ddd', borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '140px',
            padding: '4px 0',
          }}>
            {(menu.node.type === 'notebook' || menu.node.type === 'note') && (
              <div style={menuItemStyle} onClick={() => handleCreateChild(menu.node)}>
                新建{menu.node.type === 'notebook' ? '笔记' : '笔记页'}
              </div>
            )}
            <div style={menuItemStyle} onClick={() => startRename(menu.node)}>重命名</div>
            <div style={{ ...menuItemStyle, color: '#e55' }} onClick={() => handleDelete(menu.node)}>删除</div>
          </div>
        </>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  padding: '6px 16px', fontSize: '13px', cursor: 'pointer',
};
