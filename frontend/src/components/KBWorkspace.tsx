import { useState, useEffect, useCallback } from 'react';
import kbService from '../services/kbService';
import type { KnowledgeFile } from '../types/knowledgeBase';
import { useNavigationActions } from '../contexts/NavigationContext';
import ResizablePanels from './ResizablePanels';
import FilePreview from './knowledge-base/FilePreview';

const FILE_ICON: Record<string, string> = {
  md: '\uD83D\uDCDD',
  docx: '\uD83D\uDCC4',
  pdf: '\uD83D\uDCD5',
  image: '\uD83D\uDDBC',
};

export default function KBWorkspace() {
  const { selectedFolderId, selectedFileId, selectFile } = useNavigationActions();
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);

  const refreshFiles = useCallback(async () => {
    if (!selectedFolderId) { setFiles([]); return; }
    try { setFiles(await kbService.getFiles(selectedFolderId)); } catch (e) { console.error(e); }
  }, [selectedFolderId]);

  useEffect(() => { refreshFiles(); }, [refreshFiles]);

  // Load file detail when selectedFileId changes
  useEffect(() => {
    if (!selectedFileId) { setSelectedFile(null); return; }
    kbService.getFile(selectedFileId).then(setSelectedFile).catch(console.error);
  }, [selectedFileId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedFolderId) return;
    try {
      await kbService.uploadFile(selectedFolderId, file, file.name);
      refreshFiles();
    } catch (err) { console.error(err); }
    e.target.value = '';
  }

  async function handleDelete(fileId: number) {
    if (!confirm('确定删除此文件？')) return;
    try {
      await kbService.deleteFile(fileId);
      if (selectedFileId === fileId) selectFile(0);
      refreshFiles();
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {selectedFolderId ? (
        <ResizablePanels
          direction="horizontal"
          defaultRatios={[0.35, 0.65]}
          minSizes={[200, 300]}
          storageKey="panel-ratio-kb"
          className="resizable-horizontal workspace-kb"
        >
          {/* File List Panel */}
          <div style={{
            display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
            background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)',
          }}>
            <div style={{
              padding: 'var(--space-sm) var(--space-md)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
            }}>
              <span style={{
                fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)', flex: 1,
              }}>
                文件
              </span>
              <label style={{
                cursor: 'pointer', width: 22, height: 22,
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-small)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                +
                <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {files.map(f => (
                <div
                  key={f.id}
                  onClick={() => selectFile(f.id)}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-small)',
                    color: selectedFileId === f.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    background: selectedFileId === f.id ? 'var(--color-bg-selected)' : 'transparent',
                    userSelect: 'none',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                  }}
                >
                  <span>{FILE_ICON[f.file_type] || '\uD83D\uDCC4'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(f.id); }}
                    style={{
                      border: 'none', background: 'transparent',
                      color: 'var(--color-danger)', cursor: 'pointer',
                      fontSize: 'var(--font-size-small)', padding: 'var(--space-xs)',
                      flexShrink: 0,
                    }}
                  >{'✕'}</button>
                </div>
              ))}
              {files.length === 0 && (
                <div style={{
                  padding: 'var(--space-xl)', color: 'var(--color-text-tertiary)',
                  fontSize: 'var(--font-size-small)', textAlign: 'center',
                }}>
                  点击 + 上传文件
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div style={{ height: '100%', overflow: 'auto', background: 'var(--color-bg-primary)' }}>
            {selectedFile ? (
              <FilePreview file={selectedFile} />
            ) : (
              <div style={{
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-body)',
              }}>
                选择文件以预览
              </div>
            )}
          </div>
        </ResizablePanels>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-body)',
        }}>
          请从侧边栏选择文件夹
        </div>
      )}
    </div>
  );
}
