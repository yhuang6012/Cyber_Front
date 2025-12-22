import { FileText, FileAudio, Download, Trash2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { LedgerFile } from './ledgerTypes';
import { formatFileSize, isAudioFileName, isPreviewableFile } from './ledgerUtils';
import { AudioTranscribeTask } from './hooks/useAudioTranscribeTasks';

interface LedgerFileTableProps {
  files: LedgerFile[];
  isLoading: boolean;
  deletingFileIds: Set<string>;
  downloadingFileIds: Set<string>;
  previewingFileIds: Set<string>;
  audioTasks: AudioTranscribeTask[];
  onDelete: (fileId: string) => void;
  onDownload: (file: { id: string; name: string }) => void;
  onPreview: (file: { id: string; name: string }) => void;
  onStartTranscribe: (file: { id: string; name: string }) => void;
  isUploading: boolean;
}

export function LedgerFileTable({
  files,
  isLoading,
  deletingFileIds,
  downloadingFileIds,
  previewingFileIds,
  audioTasks,
  onDelete,
  onDownload,
  onPreview,
  onStartTranscribe,
  isUploading,
}: LedgerFileTableProps) {
  // 检查文件是否有正在进行的转写任务
  const fileHasTranscribeTask = (fileId: string) => {
    return audioTasks.some(t => t.fileId === fileId && (t.status === 'queued' || t.status === 'processing'));
  };

  // 获取文件的转写任务
  const getActiveTranscribeTaskForFile = (fileId: string) => {
    return audioTasks.find(t => t.fileId === fileId) || null;
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="size-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm mb-2">
          {isLoading ? '加载中...' : '该阶段暂无文件'}
        </p>
        <p className="text-xs text-muted-foreground">
          点击"子文件上传"按钮上传文件
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">文件名</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">类型</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">大小</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">上传时间</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground">操作</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const task = getActiveTranscribeTaskForFile(file.id);
            const isTaskActive = task?.status === 'queued' || task?.status === 'processing';
            const taskProgress = Math.max(0, Math.min(99, Number(task?.progress ?? 0)));

            return (
              <tr key={file.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                    {isPreviewableFile(file.name) ? (
                      <button
                        onClick={() => onPreview({ id: file.id, name: file.name })}
                        className="text-left hover:text-primary hover:underline transition-colors truncate"
                        disabled={previewingFileIds.has(file.id)}
                      >
                        {previewingFileIds.has(file.id) ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            {file.name}
                          </span>
                        ) : (
                          file.name
                        )}
                      </button>
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {file.type || '未知'}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(file.createdAt).toLocaleString('zh-CN')}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* 预览按钮 */}
                    {isPreviewableFile(file.name) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPreview({ id: file.id, name: file.name })}
                            disabled={previewingFileIds.has(file.id)}
                          >
                            {previewingFileIds.has(file.id) ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>预览</TooltipContent>
                      </Tooltip>
                    )}

                    {/* 音频转写按钮 */}
                    {isAudioFileName(file.name) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onStartTranscribe({ id: file.id, name: file.name })}
                              disabled={fileHasTranscribeTask(file.id) || isUploading}
                            >
                              {isTaskActive ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <FileAudio className="size-4" />
                              )}
                            </Button>
                            {isTaskActive && (
                              <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
                                {taskProgress}%
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isTaskActive ? `转写中 ${taskProgress}%` : '转文字'}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* 下载按钮 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDownload({ id: file.id, name: file.name })}
                          disabled={downloadingFileIds.has(file.id)}
                        >
                          {downloadingFileIds.has(file.id) ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>下载</TooltipContent>
                    </Tooltip>

                    {/* 删除按钮 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(file.id)}
                          disabled={deletingFileIds.has(file.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除</TooltipContent>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
