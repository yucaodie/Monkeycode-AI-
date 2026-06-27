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

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>AI 模型设置</h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '8px 16px', background: '#4ecdc4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
        }}>
          {showForm ? '取消' : '添加模型'}
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '16px', background: '#f8f8f8', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
              <label style={{ fontSize: '13px' }}>设为默认</label>
            </div>
          </div>
          <button onClick={handleCreate} style={{
            marginTop: '12px', padding: '8px 24px', background: '#4ecdc4', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}>
            保存
          </button>
        </div>
      )}

      {(['chat', 'embedding', 'reranker'] as const).map(cat => (
        <div key={cat} style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', color: '#444', marginBottom: '8px' }}>{CATEGORY_LABELS[cat]}</h3>
          {grouped[cat].length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px' }}>暂无配置</p>
          ) : (
            grouped[cat].map(m => (
              <div key={m.id} style={{
                padding: '12px', border: '1px solid #eee', borderRadius: '6px',
                marginBottom: '6px', background: m.is_default ? '#f0fdfa' : '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {m.name}
                    {m.is_default && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#4ecdc4', background: '#e8f8f7', padding: '1px 6px', borderRadius: '3px' }}>默认</span>}
                    {m.last_test_status === 'ok' && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#4a9', padding: '1px 6px' }}>连通</span>}
                    {m.last_test_status === 'fail' && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#e55', padding: '1px 6px' }}>失败</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{m.model_identifier} @ {m.api_base_url}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleTest(m.id)} disabled={testingId === m.id} style={actionBtnStyle}>
                    {testingId === m.id ? '...' : '测试'}
                  </button>
                  {!m.is_default && (
                    <button onClick={() => handleSetDefault(m.id)} style={actionBtnStyle}>设为默认</button>
                  )}
                  <button onClick={() => handleDelete(m.id)} style={{ ...actionBtnStyle, color: '#e55' }}>删除</button>
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '3px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' };
const actionBtnStyle: React.CSSProperties = { padding: '4px 10px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '12px' };
