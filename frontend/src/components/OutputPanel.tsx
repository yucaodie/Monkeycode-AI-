import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Knowledge, Template } from '../types';

interface OutputPanelProps {
  selectedKnowledge: Knowledge[];
  onClose: () => void;
}

export function OutputPanel({ selectedKnowledge, onClose }: OutputPanelProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const response = await apiClient.get('/output/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  async function handleGenerate() {
    if (selectedKnowledge.length === 0) {
      alert('请至少选择一个知识片段');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/output', {
        knowledgeIds: selectedKnowledge.map(k => k.id),
        templateId: selectedTemplate,
        prompt: prompt.trim(),
        outputFormat: 'markdown',
      });

      setResult(response.data.content);
    } catch (error) {
      console.error('Output generation failed:', error);
      alert('生成失败：' + (error as any).response?.data?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result) return;

    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-output-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="output-panel-overlay" onClick={onClose}>
      <div className="output-panel" onClick={e => e.stopPropagation()}>
        <div className="output-header">
          <h3>生成输出</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="output-body">
          <div className="selected-knowledge-info">
            <p>已选择 {selectedKnowledge.length} 个知识片段</p>
            <div className="knowledge-tags">
              {selectedKnowledge.map(k => (
                <span key={k.id} className="mini-tag">
                  {k.title || '无标题'}
                </span>
              ))}
            </div>
          </div>

          <div className="output-options">
            <div className="option-group">
              <label>选择模板（可选）</label>
              <select
                value={selectedTemplate || ''}
                onChange={e => setSelectedTemplate(e.target.value ? Number(e.target.value) : undefined)}
                disabled={!!prompt.trim()}
              >
                <option value="">不使用模板</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_preset ? '（预置）' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label>或用自然语言描述（可选）</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="例如：帮我写成周报格式，包含本周进展、问题、下周计划"
                rows={3}
                disabled={!!selectedTemplate}
              />
            </div>
          </div>

          <button
            className="generate-button"
            onClick={handleGenerate}
            disabled={loading || selectedKnowledge.length === 0}
          >
            {loading ? '生成中...' : '生成输出'}
          </button>

          {result && (
            <div className="output-result">
              <h4>生成结果</h4>
              <button className="download-button" onClick={handleDownload}>
                下载 Markdown
              </button>
              <pre className="result-content">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
