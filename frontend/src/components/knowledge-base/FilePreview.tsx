import { useState, useEffect } from 'react';
import kbService from '../../services/kbService';
import type { KnowledgeFile } from '../../types/knowledgeBase';

interface FilePreviewProps {
  file: KnowledgeFile;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    kbService.getFileContent(file.id).then(data => {
      setContent(data.content_markdown || '');
    }).catch(() => {
      setContent(null);
    }).finally(() => setLoading(false));
  }, [file.id]);

  if (file.file_type === 'image' && file.file_path) {
    return (
      <div style={{ padding: '16px' }}>
        <img
          src={file.file_path}
          alt={file.name}
          style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <h4 style={{ margin: '0 0 12px', color: '#333' }}>{file.name}</h4>

      {file.summary && (
        <div style={{
          background: '#f0f8ff', padding: '10px 14px', borderRadius: '6px',
          fontSize: '13px', color: '#555', marginBottom: '12px', lineHeight: 1.6,
        }}>
          <strong>AI 摘要：</strong>{file.summary}
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
        类型：{file.file_type.toUpperCase()}
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>加载中...</p>
      ) : content ? (
        <div style={{
          background: '#fafafa', padding: '12px 16px', borderRadius: '6px',
          fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap',
          fontFamily: 'monospace', maxHeight: '500px', overflow: 'auto',
        }}>
          {content}
        </div>
      ) : (
        <p style={{ color: '#999' }}>无法加载文件内容</p>
      )}
    </div>
  );
}
