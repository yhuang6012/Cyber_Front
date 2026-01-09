import { FileText, FileAudio, Download, Trash2, Loader2, Eye, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { LedgerFile } from './ledgerTypes';
import { formatFileSize, isAudioFileName, isPreviewableFile, isVisualFileName } from './ledgerUtils';
import { AudioTranscribeTask } from './hooks/useAudioTranscribeTasks';
import { VisionTranscribeTask } from './hooks/useVisionTranscribeTasks';

const shortenFileName = (name: string, maxLength = 36) => {
  if (name.length <= maxLength) return name;
  const head = name.slice(0, Math.max(12, Math.floor(maxLength * 0.55)));
  const tail = name.slice(-Math.max(6, maxLength - head.length - 1));
  return `${head}…${tail}`;
};

const shortenType = (value: string, maxLength = 16) => {
  if (value.length <= maxLength) return value;
  const head = value.slice(0, Math.max(6, Math.floor(maxLength * 0.6)));
  const tail = value.slice(-Math.max(3, maxLength - head.length - 1));
  return `${head}…${tail}`;
};

interface LedgerFileTableProps {
  files: LedgerFile[];
  isLoading: boolean;
  deletingFileIds: Set<string>;
  downloadingFileIds: Set<string>;
  previewingFileIds: Set<string>;
  audioTasks: AudioTranscribeTask[];
  visionTasks: VisionTranscribeTask[];
  onDelete: (fileId: string) => void;
  onDownload: (file: { id: string; name: string }) => void;
  onPreview: (file: { id: string; name: string }) => void;
  onStartTranscribe: (file: { id: string; name: string }) => void;
  onStartVisionTranscribe: (file: { id: string; name: string }) => void;
  isUploading: boolean;
}

export function LedgerFileTable({
  files,
  isLoading,
  deletingFileIds,
  downloadingFileIds,
  previewingFileIds,
  audioTasks,
  visionTasks,
  onDelete,
  onDownload,
  onPreview,
  onStartTranscribe,
  onStartVisionTranscribe,
  isUploading,
}: LedgerFileTableProps) {
  // 检查文件是否有正在进行的转写任务
  const fileHasTranscribeTask = (fileId: string) => {
    return audioTasks.some(t => t.fileId === fileId && (t.status === 'queued' || t.status === 'processing'));
  };

  const fileHasVisionTask = (fileId: string) => {
    return visionTasks.some(t => t.fileIds.includes(fileId) && (t.status === 'queued' || t.status === 'processing' || t.status === 'submitted'));
  };

  // 获取文件的转写任务
  const getActiveTranscribeTaskForFile = (fileId: string) => {
    return audioTasks.find(t => t.fileId === fileId) || null;
  };

  const getActiveVisionTaskForFile = (fileId: string) => {
    return visionTasks.find(t => t.fileIds.includes(fileId)) || null;
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
    <div className="overflow-x-auto min-w-0">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[40%]">文件名</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[12%] whitespace-nowrap">类型</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[12%] whitespace-nowrap">大小</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[22%] whitespace-nowrap">上传时间</th>
            <th className="text-right p-3 text-xs font-medium text-muted-foreground w-[14%] whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const task = getActiveTranscribeTaskForFile(file.id);
            const isTaskActive = task?.status === 'queued' || task?.status === 'processing';
            const taskProgress = Math.max(0, Math.min(99, Number(task?.progress ?? 0)));

            const visionTask = getActiveVisionTaskForFile(file.id);
            const isVisionActive = visionTask?.status === 'queued' || visionTask?.status === 'processing' || visionTask?.status === 'submitted';
            const visionProgress = Math.max(0, Math.min(99, Number(visionTask?.progress ?? 0)));

            return (
              <tr key={file.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-sm max-w-[320px] min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                    {isPreviewableFile(file.name) ? (
                      <button
                        onClick={() => onPreview({ id: file.id, name: file.name })}
                        className="text-left hover:text-primary hover:underline transition-colors truncate max-w-full"
                        disabled={previewingFileIds.has(file.id)}
                        title={file.name}
                      >
                        {previewingFileIds.has(file.id) ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            {shortenFileName(file.name)}
                          </span>
                        ) : (
                          shortenFileName(file.name)
                        )}
                      </button>
                    ) : (
                      <span className="truncate block max-w-full" title={file.name}>
                        {shortenFileName(file.name)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
                  <span className="block max-w-[140px] truncate" title={file.type || '未知'}>
                    {shortenType(file.type || '未知')}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  <span className="block truncate max-w-[100px]" title={formatFileSize(file.size)}>
                    {formatFileSize(file.size)}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  <span className="block truncate max-w-[140px]" title={new Date(file.createdAt).toLocaleString('zh-CN')}>
                    {new Date(file.createdAt).toLocaleString('zh-CN')}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {/* 进度显示 */}
                    {(isTaskActive || isVisionActive) && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {isTaskActive ? `${taskProgress}%` : `${visionProgress}%`}
                      </span>
                    )}
                    
                    {/* 操作菜单 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border border-border shadow-lg p-1.5">
                        {/* 预览 */}
                        {isPreviewableFile(file.name) && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onPreview({ id: file.id, name: file.name })}
                              disabled={previewingFileIds.has(file.id)}
                            >
                              {previewingFileIds.has(file.id) ? (
                                <Loader2 className="size-4 mr-2 ml-1 animate-spin text-foreground" />
                              ) : (
                                <Eye className="size-4 mr-2 ml-1 text-foreground" />
                              )}
                              预览
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {/* 音频转写 */}
                        {isAudioFileName(file.name) && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onStartTranscribe({ id: file.id, name: file.name })}
                              disabled={fileHasTranscribeTask(file.id) || isUploading}
                              className="text-blue-600"
                            >
                              {isTaskActive ? (
                                <Loader2 className="size-4 mr-2 ml-1 animate-spin text-blue-600" />
                              ) : (
                                <FileAudio className="size-4 mr-2 ml-1 text-blue-600" />
                              )}
                              音频转写 {isTaskActive && `(${taskProgress}%)`}
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {/* 视觉转写 */}
                        {isVisualFileName(file.name) && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => onStartVisionTranscribe({ id: file.id, name: file.name })}
                              disabled={fileHasVisionTask(file.id) || isUploading}
                              className="text-purple-600"
                            >
                              {isVisionActive ? (
                                <Loader2 className="size-4 mr-2 ml-1 animate-spin text-purple-600" />
                              ) : (
                                <Video className="size-4 mr-2 ml-1 text-purple-600" />
                              )}
                              视觉转写 {isVisionActive && `(${visionProgress}%)`}
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {/* 下载 */}
                        <DropdownMenuItem 
                          onClick={() => onDownload({ id: file.id, name: file.name })}
                          disabled={downloadingFileIds.has(file.id)}
                        >
                          {downloadingFileIds.has(file.id) ? (
                            <Loader2 className="size-4 mr-2 ml-1 animate-spin text-foreground" />
                          ) : (
                            <Download className="size-4 mr-2 ml-1 text-foreground" />
                          )}
                          下载
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className='m-1'/>
                        
                        {/* 删除 */}
                        <DropdownMenuItem 
                          onClick={() => onDelete(file.id)}
                          disabled={deletingFileIds.has(file.id)}
                          className="text-destructive hover:bg-destructive/5 hover:text-destructive focus:bg-destructive/5 focus:text-destructive"
                        >
                          {deletingFileIds.has(file.id) ? (
                            <Loader2 className="size-4 mr-2 ml-1 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="size-4 mr-2 ml-1 text-destructive" />
                          )}
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
