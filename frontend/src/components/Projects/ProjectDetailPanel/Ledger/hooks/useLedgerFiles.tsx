import { useState, useCallback, useRef } from 'react';
import { getProjectFiles, deleteProjectFile, getProjectFileDownloadUrl, getProjectFilePreviewUrl, uploadProjectFiles } from '@/lib/projectApi';
import { toast } from 'sonner';
import { LedgerFile } from '../ledgerTypes';
import { useAppStore } from '@/store/useAppStore';

interface UseLedgerFilesOptions {
  projectId: string;
}

export function useLedgerFiles({ projectId }: UseLedgerFilesOptions) {
  const [files, setFiles] = useState<LedgerFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(new Set());
  const [downloadingFileIds, setDownloadingFileIds] = useState<Set<string>>(new Set());
  const [previewingFileIds, setPreviewingFileIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 刷新文件列表
  const refreshFiles = useCallback(async (opts?: { status?: string }) => {
    setIsLoadingFiles(true);
    try {
      const list = await getProjectFiles(projectId, { status: opts?.status });
      setFiles(list.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        createdAt: f.createdAt,
      })));
    } finally {
      setIsLoadingFiles(false);
    }
  }, [projectId]);

  // 删除文件
  const handleDeleteFile = useCallback(async (fileId: string, statusToUse?: string) => {
    setDeletingFileIds(prev => new Set(prev).add(fileId));
    try {
      await deleteProjectFile(projectId, fileId);
      toast.success(<div className="text-sm text-emerald-600 whitespace-nowrap">文件已删除</div>, { duration: 3000 });
      await refreshFiles({ status: statusToUse ?? 'all' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败';
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    } finally {
      setDeletingFileIds(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, [projectId, refreshFiles]);

  // 下载文件
  const handleDownloadFile = useCallback(async (file: { id: string; name: string }) => {
    setDownloadingFileIds(prev => new Set(prev).add(file.id));
    try {
      const { preview_url } = await getProjectFileDownloadUrl(projectId, file.id);
      const a = document.createElement('a');
      a.href = preview_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '下载失败';
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    } finally {
      setDownloadingFileIds(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  }, [projectId]);

  // 预览文件 - 发送到 Chat 面板
  const handlePreviewFile = useCallback(async (file: { id: string; name: string }) => {
    setPreviewingFileIds(prev => new Set(prev).add(file.id));
    try {
      const data = await getProjectFilePreviewUrl(projectId, file.id);
      // 添加预览消息到 Chat
      useAppStore.getState().addFilePreviewMessage({
        weboffice_url: data.weboffice_url,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        file_name: data.file_name,
        file_id: data.file_id,
        expires_in_seconds: data.expires_in_seconds,
      });
      toast.success(<div className="text-sm text-emerald-600 whitespace-nowrap">已在对话面板打开预览</div>, { duration: 2000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取预览链接失败';
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    } finally {
      setPreviewingFileIds(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  }, [projectId]);

  // 上传文件
  const handleFileUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    statusToUse?: string
  ) => {
    const uploadFiles = Array.from(e.target.files || []);
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      const result = await uploadProjectFiles(projectId, uploadFiles);

      if (Array.isArray(result)) {
        const successCount = result.filter((item: any) => !item.error).length;
        const errorCount = result.filter((item: any) => item.error).length;

        if (errorCount > 0) {
          toast.error(
            <div className="text-sm text-red-600 leading-snug whitespace-nowrap">
              上传完成：{successCount}成功，{errorCount}失败
            </div>,
            { duration: 3000 },
          );
        } else {
          toast.success(
            <div className="text-sm text-emerald-600 leading-snug whitespace-nowrap">
              成功上传 {successCount} 个文件
            </div>,
            { duration: 3000 },
          );
        }
      } else {
        toast.success(
          <div className="text-sm text-emerald-600 leading-snug whitespace-nowrap">
            文件上传成功
          </div>,
          { duration: 3000 },
        );
      }

      await refreshFiles({ status: statusToUse ?? 'all' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败';
      toast.error(
        <div className="text-sm text-red-600 leading-snug whitespace-nowrap">
          {message}
        </div>,
        { duration: 3000 },
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [projectId, refreshFiles]);

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    files,
    isLoadingFiles,
    isUploading,
    deletingFileIds,
    downloadingFileIds,
    previewingFileIds,
    fileInputRef,
    refreshFiles,
    handleDeleteFile,
    handleDownloadFile,
    handlePreviewFile,
    handleFileUpload,
    triggerFileSelect,
  };
}
