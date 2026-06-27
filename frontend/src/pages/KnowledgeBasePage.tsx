import { useState, useEffect } from 'react';
import kbService from '../services/kbService';
import type { KnowledgeFolder, KnowledgeFile } from '../types/knowledgeBase';
import FolderList from '../components/knowledge-base/FolderList';
import FilePanel from '../components/knowledge-base/FilePanel';
import FilePreview from '../components/knowledge-base/FilePreview';

export default function KnowledgeBasePage() {
  const [folders, setFolders] = useState<KnowledgeFolder[]>([]);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);

  useEffect(() => {
    kbService.getFolders().then(setFolders).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedFolder !== null) {
      kbService.getFiles(selectedFolder).then(setFiles).catch(console.error);
      setSelectedFile(null);
    }
  }, [selectedFolder]);

  function refreshFiles() {
    if (selectedFolder !== null) {
      kbService.getFiles(selectedFolder).then(setFiles).catch(console.error);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Column 1: Folders */}
      <div style={{
        width: '220px', minWidth: '220px',
        borderRight: '1px solid #e0e0e0',
        overflow: 'auto', background: '#fafafa',
      }}>
        <FolderList
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
          onCreate={name => kbService.createFolder(name).then(f => setFolders(prev => [...prev, f])).catch(console.error)}
          onRename={(id, name) => kbService.updateFolder(id, { name }).then(() =>
            setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
          ).catch(console.error)}
          onDelete={id => kbService.deleteFolder(id).then(() => {
            setFolders(prev => prev.filter(f => f.id !== id));
            if (selectedFolder === id) { setSelectedFolder(null); setFiles([]); setSelectedFile(null); }
          }).catch(console.error)}
        />
      </div>

      {/* Column 2: Files */}
      <div style={{
        width: '280px', minWidth: '280px',
        borderRight: '1px solid #e0e0e0',
        overflow: 'auto', background: '#fafafa',
      }}>
        {selectedFolder ? (
          <FilePanel
            files={files}
            selectedId={selectedFile?.id ?? null}
            onSelect={setSelectedFile}
            onUpload={(file, name) =>
              kbService.uploadFile(selectedFolder, file, name).then(() => refreshFiles()).catch(console.error)
            }
            onRename={(id, name) => kbService.updateFile(id, { name }).then(() =>
              setFiles(prev => prev.map(f => f.id === id ? { ...f, name } : f))
            ).catch(console.error)}
            onDelete={id => kbService.deleteFile(id).then(() => {
              setFiles(prev => prev.filter(f => f.id !== id));
              if (selectedFile?.id === id) setSelectedFile(null);
            }).catch(console.error)}
          />
        ) : (
          <div style={{ padding: '20px', color: '#999', fontSize: '13px' }}>请先选择文件夹</div>
        )}
      </div>

      {/* Column 3: Preview */}
      <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
        {selectedFile ? (
          <FilePreview file={selectedFile} />
        ) : (
          <div style={{ padding: '40px', color: '#999', textAlign: 'center' }}>
            {selectedFolder ? '选择文件以预览' : '选择文件夹查看文件'}
          </div>
        )}
      </div>
    </div>
  );
}
