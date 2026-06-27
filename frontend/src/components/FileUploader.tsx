import { useState, useCallback } from 'react';
import { uploadService } from '../services/knowledgeService';
import { Knowledge } from '../types';

interface FileUploaderProps {
  onUploadSuccess?: (result: Knowledge) => void;
  onUploadError?: (error: Error) => void;
}

export function FileUploader({ onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      onUploadError?.(new Error('不支持的文件类型，仅支持 PDF、Word 和图片格式'));
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      onUploadError?.(new Error('文件大小不能超过 50MB'));
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadService.uploadFile(file);
      
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        onUploadSuccess?.(result);
      }, 500);
    } catch (error) {
      setUploading(false);
      setProgress(0);
      onUploadError?.(error as Error);
    }
  }, [onUploadSuccess, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files[0]);
    }
    // Reset input
    e.target.value = '';
  }, [handleUpload]);

  return (
    <div className="file-uploader">
      <div
        className={`upload-area ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p>上传中... {progress}%</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              拖拽文件到此处，或<span className="upload-link">点击选择文件</span>
            </p>
            <p className="upload-hint">
              支持 PDF、Word (.docx/.doc)、图片 (.jpg/.png/.gif/.webp)，最大 50MB
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileInput}
              className="file-input"
            />
          </>
        )}
      </div>

      {uploading && (
        <div className="upload-status">
          <p>正在解析文档内容并提取知识...</p>
          <p className="status-hint">AI 将自动生成标签和摘要</p>
        </div>
      )}
    </div>
  );
}
