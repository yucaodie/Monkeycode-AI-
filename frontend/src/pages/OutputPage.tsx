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

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2>模板输出</h2>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px' }}>选择内容来源</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          {notebooks.map(nb => (
            <button key={nb.id} onClick={() => loadPages(nb.id)} style={srcBtnStyle}>
              📓 {nb.name}
            </button>
          ))}
          {files.slice(0, 5).map(f => (
            <button key={f.id} onClick={() => loadFileContent(f.id)} style={srcBtnStyle}>
              📄 {f.name}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="在此粘贴内容，或点击上方来源加载..."
        rows={8}
        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }}
      />

      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '13px', color: '#666' }}>模板</label>
          <select
            value={selectedTemplate || ''}
            onChange={e => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', marginTop: '4px' }}
          >
            <option value="">不使用模板</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}{t.is_preset ? ' (预置)' : ''}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: '13px', color: '#666' }}>自定义指令</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="例如：帮我写成周报格式..."
            rows={2}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical', marginTop: '4px' }}
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !content.trim()}
        style={{
          marginTop: '16px', padding: '10px 24px', background: '#4ecdc4', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '生成中...' : '生成输出'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f8f8f8', borderRadius: '8px', border: '1px solid #eee' }}>
          <h4 style={{ margin: '0 0 8px' }}>生成结果</h4>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.8 }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

const srcBtnStyle: React.CSSProperties = {
  padding: '4px 12px', border: '1px solid #ddd', borderRadius: '4px',
  background: '#f8f8f8', cursor: 'pointer', fontSize: '12px',
};
