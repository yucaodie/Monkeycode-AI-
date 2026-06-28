import { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface ModelConfig {
  id: number;
  name: string;
  category: 'chat' | 'embedding' | 'reranker';
  api_base_url: string;
  api_key: string;
  model_identifier: string;
  is_default: boolean;
  is_active: boolean;
  last_test_status: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  chat: '问答模型',
  embedding: '向量模型',
  reranker: '重排序模型',
};

export default function SettingsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'chat' as string, api_base_url: '', api_key: '', model_identifier: '', is_default: false,
  });

  useEffect(() => { loadModels(); }, []);

  async function loadModels() {
    const { data } = await apiClient.get('/models');
    setModels(data);
  }

  async function handleCreate() {
    if (!form.name || !form.api_base_url || !form.api_key || !form.model_identifier) return;
    await apiClient.post('/models', form);
    setShowForm(false);
    setForm({ name: '', category: 'chat', api_base_url: '', api_key: '', model_identifier: '', is_default: false });
    loadModels();
  }

  async function handleSetDefault(id: number) {
    await apiClient.put(`/models/${id}/default`);
    loadModels();
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除此模型配置？')) return;
    await apiClient.delete(`/models/${id}`);
    loadModels();
  }

  async function handleTest(id: number) {
    setTestingId(id);
    try {
      const { data } = await apiClient.post(`/models/${id}/test`);
      alert(`测试结果: ${data.status}${data.error ? ` (${data.error})` : ''}`);
    } catch {
      alert('测试失败');
    } finally {
      setTestingId(null);
      loadModels();
    }
  }

  const grouped = { chat: [] as ModelConfig[], embedding: [] as ModelConfig[], reranker: [] as ModelConfig[] };
  for (const m of models) grouped[m.category].push(m);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--font-size-small)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-xs)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-xs) var(--space-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-small)',
    boxSizing: 'border-box',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
  };

  const actionBtnStyle: React.CSSProperties = {
    padding: 'var(--space-xs) var(--space-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-bg-primary)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-small)',
    color: 'var(--color-text-secondary)',
  };

  return (
    <div style={{ maxWidth: 800, height: '100%', overflow: 'auto', padding: 'var(--space-xl)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--space-xl)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 'var(--font-size-h2)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
        }}>AI 模型设置</h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: 'var(--space-sm) var(--space-lg)',
          background: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-body)',
        }}>
          {showForm ? '取消' : '添加模型'}
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: 'var(--space-lg)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-lg)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div>
              <label style={labelStyle}>名称</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="如: 本地 Qwen 7B" />
            </div>
            <div>
              <label style={labelStyle}>类别</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                <option value="chat">问答模型</option>
                <option value="embedding">向量模型</option>
                <option value="reranker">重排序模型</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>API 地址</label>
              <input value={form.api_base_url} onChange={e => setForm({ ...form, api_base_url: e.target.value })} style={inputStyle} placeholder="http://localhost:8080/v1" />
            </div>
            <div>
              <label style={labelStyle}>API Key</label>
              <input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} style={inputStyle} placeholder="sk-..." type="password" />
            </div>
            <div>
              <label style={labelStyle}>模型标识符</label>
              <input value={form.model_identifier} onChange={e => setForm({ ...form, model_identifier: e.target.value })} style={inputStyle} placeholder="qwen2.5-7b-instruct" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
              <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)' }}>设为默认</label>
            </div>
          </div>
          <button onClick={handleCreate} style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm) var(--space-2xl)',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-body)',
          }}>
            保存
          </button>
        </div>
      )}

      {(['chat', 'embedding', 'reranker'] as const).map(cat => (
        <div key={cat} style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-sm)',
            fontWeight: 'var(--font-weight-medium)',
          }}>{CATEGORY_LABELS[cat]}</h3>
          {grouped[cat].length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-small)' }}>暂无配置</p>
          ) : (
            grouped[cat].map(m => (
              <div key={m.id} style={{
                padding: 'var(--space-md)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-xs)',
                background: m.is_default ? 'var(--color-bg-selected)' : 'var(--color-bg-primary)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
                    {m.name}
                    {m.is_default && (
                      <span style={{
                        marginLeft: 'var(--space-sm)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-primary)',
                        background: 'var(--color-primary-bg)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                      }}>默认</span>
                    )}
                    {m.last_test_status === 'ok' && (
                      <span style={{
                        marginLeft: 'var(--space-xs)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-success)',
                        padding: '1px 6px',
                      }}>连通</span>
                    )}
                    {m.last_test_status === 'fail' && (
                      <span style={{
                        marginLeft: 'var(--space-xs)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-error)',
                        padding: '1px 6px',
                      }}>失败</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'var(--space-xs)',
                  }}>{m.model_identifier} @ {m.api_base_url}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button onClick={() => handleTest(m.id)} disabled={testingId === m.id} style={actionBtnStyle}>
                    {testingId === m.id ? '...' : '测试'}
                  </button>
                  {!m.is_default && (
                    <button onClick={() => handleSetDefault(m.id)} style={actionBtnStyle}>设为默认</button>
                  )}
                  <button onClick={() => handleDelete(m.id)} style={{ ...actionBtnStyle, color: 'var(--color-error)' }}>删除</button>
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
