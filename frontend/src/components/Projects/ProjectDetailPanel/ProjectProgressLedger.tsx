import { useState, useMemo, useEffect, useCallback } from 'react';
import { ProjectItem } from '@/store/useAppStore';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// 拆分出的模块
import { LEDGER_STEPS, ProjectStatus } from './ledgerTypes';
import { useLedgerFiles } from './hooks/useLedgerFiles';
import { useAudioTranscribeTasks } from './hooks/useAudioTranscribeTasks';
import { LedgerStepProgress } from './LedgerStepProgress';
import { LedgerFileTable } from './LedgerFileTable';
import { AudioTranscribeDialog } from './AudioTranscribeDialog';

interface ProjectProgressLedgerProps {
  project: ProjectItem;
}

export function ProjectProgressLedger({ project }: ProjectProgressLedgerProps) {
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [hasUserSelectedStatus, setHasUserSelectedStatus] = useState(false);

  // 音频转写对话框状态
  const [transcribeDialogOpen, setTranscribeDialogOpen] = useState(false);
  const [transcribeTargetFile, setTranscribeTargetFile] = useState<{ id: string; name: string } | null>(null);
  const [isSubmittingTranscribe, setIsSubmittingTranscribe] = useState(false);

  // 文件操作 hook
  const {
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
  } = useLedgerFiles({ projectId: String(project.id) });

  // 音频转写 hook
  const audioTasks = useAudioTranscribeTasks({
    onAnyTaskSucceeded: () => {
      const statusToUse = hasUserSelectedStatus ? selectedStatus : 'all';
      void refreshFiles({ status: statusToUse });
    },
    pollIntervalMs: 5000,
  });

  // 当项目状态变化时，重置筛选规则
  useEffect(() => {
    setHasUserSelectedStatus(false);
    setSelectedStatus(undefined);
  }, [project.status]);

  // 初始加载
  useEffect(() => {
    void refreshFiles({ status: 'all' });
  }, [refreshFiles]);

  // 获取当前状态字符串
  const getStatusToUse = useCallback(() => {
    return hasUserSelectedStatus ? selectedStatus : 'all';
  }, [hasUserSelectedStatus, selectedStatus]);

  // 搜索过滤
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // 步骤点击处理
  const handleStepClick = useCallback((stepIndex: number) => {
    const stepId = LEDGER_STEPS[stepIndex].id;
    setHasUserSelectedStatus(true);
    const status = project.status === 'rejected' && stepIndex === 1 ? 'rejected' : stepId;
    setSelectedStatus(status);
    void refreshFiles({ status });
  }, [project.status, refreshFiles]);

  // 点击转写按钮 -> 打开对话框
  const handleStartTranscribe = useCallback((file: { id: string; name: string }) => {
    setTranscribeTargetFile(file);
    setTranscribeDialogOpen(true);
  }, []);

  // 对话框确认后提交转写任务
  const handleConfirmTranscribe = useCallback(async (customPrompt: string) => {
    if (!transcribeTargetFile) return;

    setIsSubmittingTranscribe(true);
    try {
      const taskId = await audioTasks.startTaskForFile({
        fileId: transcribeTargetFile.id,
        fileName: transcribeTargetFile.name,
        customPrompt: customPrompt || undefined,
      });
      console.log('[ProjectProgressLedger][audio] task submitted ->', {
        fileId: transcribeTargetFile.id,
        taskId,
        fileName: transcribeTargetFile.name,
        customPrompt,
      });
      toast.success(
        <div className="text-sm text-emerald-600 whitespace-nowrap">已提交音频转写任务</div>,
        { duration: 3000 },
      );
      setTranscribeDialogOpen(false);
      setTranscribeTargetFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交音频转写任务失败';
      console.error('[ProjectProgressLedger][audio] submit error', err);
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    } finally {
      setIsSubmittingTranscribe(false);
    }
  }, [audioTasks, transcribeTargetFile]);

  // 取消转写对话框
  const handleCancelTranscribe = useCallback(() => {
    if (!isSubmittingTranscribe) {
      setTranscribeDialogOpen(false);
      setTranscribeTargetFile(null);
    }
  }, [isSubmittingTranscribe]);

  // 全局"空白点击"重置筛选
  useEffect(() => {
    if (!hasUserSelectedStatus) return;

    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      // 点在状态条的可点击 segment 上不重置
      if (target.closest('[data-status-segment="true"]')) return;

      // 点在交互控件/表格行上不重置
      if (target.closest('button,a,input,textarea,select,[role="button"],[role="link"],tr,td,th')) {
        return;
      }

      // 其余区域视为"空白处"：重置为 all
      setHasUserSelectedStatus(false);
      setSelectedStatus(undefined);
      void refreshFiles({ status: 'all' });
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [hasUserSelectedStatus, refreshFiles]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 步骤进度条 */}
      <LedgerStepProgress
        projectStatus={project.status as ProjectStatus}
        onStepClick={handleStepClick}
      />

      {/* 文件列表区域 */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* 搜索和操作栏 */}
        <div className="px-8 py-4 border-b border-border/50 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件名..."
              className="max-w-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => void refreshFiles({ status: getStatusToUse() })}
              disabled={isLoadingFiles}
            >
              {isLoadingFiles ? '刷新中...' : '刷新'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => handleFileUpload(e, getStatusToUse())}
            />
            <Button
              variant="default"
              size="sm"
              onClick={triggerFileSelect}
              className="gap-2 cursor-pointer"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <FolderPlus className="size-4" />
                  子文件上传
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 文件表格 */}
        <ScrollArea className="flex-1">
          <div className="px-8 py-4">
            <LedgerFileTable
              files={filteredFiles}
              isLoading={isLoadingFiles}
              deletingFileIds={deletingFileIds}
              downloadingFileIds={downloadingFileIds}
              previewingFileIds={previewingFileIds}
              audioTasks={audioTasks.tasks}
              onDelete={(fileId) => handleDeleteFile(fileId, getStatusToUse())}
              onDownload={handleDownloadFile}
              onPreview={handlePreviewFile}
              onStartTranscribe={handleStartTranscribe}
              isUploading={isUploading}
            />
          </div>
        </ScrollArea>
      </div>

      {/* 音频转写对话框 */}
      <AudioTranscribeDialog
        open={transcribeDialogOpen}
        fileName={transcribeTargetFile?.name ?? ''}
        onCancel={handleCancelTranscribe}
        onConfirm={handleConfirmTranscribe}
        isSubmitting={isSubmittingTranscribe}
      />
    </div>
  );
}
