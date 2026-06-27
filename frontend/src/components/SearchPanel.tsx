import { useState } from 'react';
import apiClient from '../services/api';
import { Knowledge } from '../types';

interface SearchResult extends Knowledge {
  score: number;
}

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await apiClient.get('/search', {
        params: { q: query, limit: 10 },
      });
      setResults(response.data.results || []);
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-panel">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索你的知识库...（支持自然语言）"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <div className="search-empty">
          <p>未找到相关知识</p>
          <p className="search-tip">试试其他关键词，或者添加新的知识片段</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <p className="results-count">找到 {results.length} 条相关知识</p>
          {results.map((result) => (
            <div key={result.id} className="result-card">
              <div className="score-badge">
                匹配度 {(result.score * 100).toFixed(0)}%
              </div>
              <h4>{result.title || '无标题'}</h4>
              <p className="result-content">
                {result.content.substring(0, 150)}...
              </p>
              <div className="result-meta">
                {result.tags && result.tags.length > 0 && (
                  <div className="result-tags">
                    {result.tags.map((tag: { id: number; name: string; color?: string }) => (
                      <span
                        key={tag.id}
                        className="tag"
                        style={{ backgroundColor: tag.color || '#646cff' }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <span className="date">
                  {new Date(result.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
