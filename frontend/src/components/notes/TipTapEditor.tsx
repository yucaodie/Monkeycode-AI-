import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useCallback } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleHeading = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
  const toggleCodeBlock = useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor]);

  if (!editor) return <div style={{ padding: '20px', color: '#999' }}>加载编辑器...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        borderBottom: '1px solid #e0e0e0',
        padding: '6px 12px',
        display: 'flex',
        gap: '2px',
        flexWrap: 'wrap',
      }}>
        <Btn onClick={toggleBold} active={editor.isActive('bold')} label="B" />
        <Btn onClick={toggleItalic} active={editor.isActive('italic')} label="I" />
        <Separator />
        <Btn onClick={toggleHeading} active={editor.isActive('heading', { level: 2 })} label="H2" />
        <Separator />
        <Btn onClick={toggleBulletList} active={editor.isActive('bulletList')} label="•" />
        <Btn onClick={toggleOrderedList} active={editor.isActive('orderedList')} label="1." />
        <Separator />
        <Btn onClick={toggleBlockquote} active={editor.isActive('blockquote')} label="❝" />
        <Btn onClick={toggleCodeBlock} active={editor.isActive('codeBlock')} label="&lt;/&gt;" />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Btn({ onClick, active, label }: { onClick: () => void; active: boolean; label: string }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      style={{
        border: '1px solid ' + (active ? '#4ecdc4' : '#ddd'),
        background: active ? '#e8f8f7' : '#fff',
        borderRadius: '4px',
        padding: '4px 10px',
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        fontSize: '13px',
        minWidth: '28px',
      }}
    >
      {label}
    </button>
  );
}

function Separator() {
  return <span style={{ width: '1px', background: '#ddd', margin: '2px 4px' }} />;
}
