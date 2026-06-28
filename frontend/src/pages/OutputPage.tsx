import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import notesService from '../services/notesService';
import kbService from '../services/kbService';
import type { NotePage } from '../types/notes';
import type { KnowledgeFile } from '../types/knowledgeBase';

interface Template {
  id: number;
  name: string;
  type: string;
  content: string;
  description?: string;
  is_preset: boolean;
}

export default function OutputPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [pageCache, setPageCache] = useState<NotePage[]>([]);

  useEffect(() => {
    apiClient.get('/output/templates').then(r => setTemplates(r.data || [])).catch(console.error);
    notesService.getNotebooks().then(setNotebooks).catch(console.error);
    kbService.getFolders().then(folders => {
      if (folders.length > 0) kbService.getFiles(folders[0].id).then(setFiles).catch(() => {});
    }).catch(() => {});
  }, []);

  async function loadPages(notebookId: number) {
    const notes = await notesService.getNotes(notebookId);
    const allPages: NotePage[] = [];
    for (const n of notes) {
      const pages = await notesService.getPages(n.id);
      allPages.push(...pages);
    }
    setPageCache(allPages);
    const text = allPages.map(p => p.plain_text || p.content.replace(/<[^>]*>/g, '')).join('\n\n');
    setContent(text);
  }

  async function loadFileContent(fileId: number) {
    const data = await kbService.getFileContent(fileId);
    setContent(data.content_markdown || '');
  }

  async function handleGenerate() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/output', {
        knowledgeIds: [1],
        templateId: selectedTemplate || undefined,
        prompt: prompt.trim() || undefined,
        outputFormat: 'markdown',
      });
      setResult(data.content);
    } catch (err) {
      alert('生成失败');
    } finally {
      setLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-body)',
    boxSizing: 'border-box',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
  };

  const srcBtnStyle: React.CSSProperties = {
    padding: 'var(--space-xs) var(--space-md)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-bg-secondary)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-small)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div style={{ maxWidth: 800, height: '100%', overflow: 'auto', padding: 'var(--space-xl)' }}>
      <h2 style={{
        margin: '0 0 var(--space-lg)',
        fontSize: 'var(--font-size-h2)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
      }}>模板输出</h2>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4 style={{
          margin: '0 0 var(--space-sm)',
          fontSize: 'var(--font-size-body)',
          color: 'var(--color-text-secondary)',
        }}>选择内容来源</h4>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {notebooks.map(nb => (
            <button key={nb.id} onClick={() => loadPages(nb.id)} style={srcBtnStyle}>
              {nb.name}
            </button>
          ))}
          {files.slice(0, 5).map(f => (
            <button key={f.id} onClick={() => loadFileContent(f.id)} style={srcBtnStyle}>
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="在此粘贴内容，或点击上方来源加载..."
        rows={8}
        style={{ ...inputBase, resize: 'vertical', marginBottom: 'var(--space-md)' }}
      />

      <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-xs)',
          }}>模板</label>
          <select
            value={selectedTemplate || ''}
            onChange={e => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
            style={inputBase}
          >
            <option value="">不使用模板</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}{t.is_preset ? ' (预置)' : ''}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-xs)',
          }}>自定义指令</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="例如：帮我写成周报格式..."
            rows={2}
            style={{ ...inputBase, resize: 'vertical' }}
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !content.trim()}
        style={{
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-sm) var(--space-2xl)',
          background: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 'var(--font-size-body)',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '生成中...' : '生成输出'}
      </button>

      {result && (
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-light)',
        }}>
          <h4 style={{
            margin: '0 0 var(--space-sm)',
            color: 'var(--color-text-primary)',
          }}>生成结果</h4>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontSize: 'var(--font-size-body)',
            lineHeight: 'var(--line-height-relaxed)',
            color: 'var(--color-text-primary)',
          }}>{result}</pre>
        </div>
      )}
    </div>
  );
}
