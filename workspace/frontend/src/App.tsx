import { useState, useEffect } from 'react';
import knowledgeService from './services/knowledgeService';
import { SearchPanel } from './components/SearchPanel';
import { FileUploader } from './components/FileUploader';
import { Knowledge } from './types';
import './App.css';

function App() {
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function loadKnowledge() {
    try {
      setLoading(true);
      const response = await knowledgeService.getList({ limit: 10 });
      setKnowledgeList(response.items);
      setError(null);
    } catch (err) {
      setError('Failed to load knowledge');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Knowledge Assistant - 知识助手</h1>
        <p>快速保存、智能搜索、按需输出</p>
      </header>

      <main className="app-main">
        <div className="welcome-section">
          <h2>欢迎使用知识助手</h2>
          <p>这是一个轻量级的个人知识管理工具，帮助你：</p>
          <ul className="feature-list">
            <li>✏️ <strong>快速保存</strong> - 粘贴文本或上传文档（PDF/Word/图片），AI 自动分类打标签</li>
            <li>🔍 <strong>语义搜索</strong> - 自然语言查询，快速找到相关知识</li>
            <li>📄 <strong>智能输出</strong> - 按你要求整理成技术方案、申报表等格式</li>
          </ul>
        </div>

        {/* 文件上传 */}
        <FileUploader
          onUploadSuccess={(result) => {
            console.log('Upload success:', result);
            // Reload knowledge list
            loadKnowledge();
          }}
          onUploadError={(error) => {
            console.error('Upload failed:', error);
            alert(`上传失败：${error.message}`);
          }}
        />

        {/* 搜索面板 */}
        <SearchPanel />

        <div className="knowledge-section">
          <h3>最近的知识</h3>
          
          {loading && <p className="loading">加载中...</p>}
          {error && <p className="error">{error}</p>}
          
          {!loading && !error && knowledgeList.length === 0 && (
            <p className="empty">暂无知识，快来添加第一条吧！</p>
          )}
          
          {!loading && !error && knowledgeList.length > 0 && (
            <div className="knowledge-list">
              {knowledgeList.map((item) => (
                <div key={item.id} className="knowledge-card">
                  <h4>{item.title || '无标题'}</h4>
                  <p className="content-preview">
                    {item.content.substring(0, 100)}...
                  </p>
                  <div className="meta">
                    <span className="type">类型：{item.original_type}</span>
                    <span className="date">
                      {new Date(item.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="status-cards">
          <div className="status-card">
            <h4>✅ 已完成</h4>
            <ul>
              <li>前后端项目骨架搭建</li>
              <li>数据库设计和初始化</li>
              <li>知识管理 API（CRUD）</li>
              <li>标签管理 API</li>
            </ul>
          </div>
          <div className="status-card">
            <h4>🚧 开发中</h4>
            <ul>
              <li>AI 客户端集成</li>
              <li>文件上传和解析</li>
              <li>语义搜索</li>
              <li>聊天式交互界面</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Knowledge Assistant v1.0.0 - MVP Development</p>
      </footer>
    </div>
  );
}

export default App;
