import { useState } from 'react';
import { useAppStore, UploadedFileMeta } from '@/store/useAppStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Folder, FolderPlus, ChevronRight, ChevronDown, MoreVertical, Trash2, FolderInput, FileAudio, FileType } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

function getFileIcon(type: string) {
  if (type.includes('pdf')) return <FileText className="size-4 text-red-500" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileText className="size-4 text-green-600" />;
  if (type.includes('presentation') || type.includes('powerpoint')) return <FileText className="size-4 text-orange-500" />;
  if (type.includes('word') || type.includes('document')) return <FileText className="size-4 text-blue-600" />;
  if (type.includes('audio')) return <FileAudio className="size-4 text-purple-600" />;
  if (type.includes('markdown')) return <FileType className="size-4 text-gray-600" />;
  return <FileText className="size-4 text-muted-foreground" />;
}

function isAudioFile(type: string, name: string) {
  return type.includes('audio') || name.toLowerCase().endsWith('.mp3') || name.toLowerCase().endsWith('.wav') || name.toLowerCase().endsWith('.m4a');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileListProps {
  searchQuery?: string;
}

export function FileList({ searchQuery = '' }: FileListProps) {
  const { folders, uploadedFiles, addFolder, removeFolder, moveFileToFolder } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map(f => f.id)));
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      addFolder(newFolderName.trim(), randomColor);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('确定要删除此文件夹吗？文件夹内的文件将移至"未分类"。')) {
      removeFolder(folderId);
    }
  };

  const handleMoveFile = (fileId: string, folderId?: string) => {
    moveFileToFolder(fileId, folderId);
  };

  const handleTranscribeAudio = (file: UploadedFileMeta) => {
    // 模拟转文字功能
    const baseName = file.name.replace(/\.(mp3|wav|m4a)$/i, '');
    const transcriptFileName = `${baseName}-转录文本.md`;
    
    // 检查是否已存在转录文本
    const existingTranscript = uploadedFiles.find(f => f.name === transcriptFileName);
    
    if (existingTranscript) {
      alert('该音频文件已有转录文本！');
    } else {
      alert('开始转录音频文件...\n\n这是一个模拟功能，实际使用时会调用语音识别API进行转录。');
      // 实际项目中，这里会调用后端API进行音频转文字
    }
  };

  const handleDragStart = (e: React.DragEvent, file: UploadedFileMeta) => {
    e.stopPropagation();
    const dragData = {
      id: file.id,
      type: 'file',
      title: file.name,
      content: JSON.stringify({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        createdAt: file.createdAt,
      }, null, 2),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Filter files by search query
  const filteredFiles = uploadedFiles.filter(file => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return file.name.toLowerCase().includes(query);
  });

  // Group filtered files by folder
  const filesByFolder: Record<string, UploadedFileMeta[]> = {};
  const uncategorizedFiles: UploadedFileMeta[] = [];

  filteredFiles.forEach(file => {
    if (file.folderId) {
      if (!filesByFolder[file.folderId]) {
        filesByFolder[file.folderId] = [];
      }
      filesByFolder[file.folderId].push(file);
    } else {
      uncategorizedFiles.push(file);
    }
  });

  return (
    <div className="space-y-4">
      {/* Create Folder Section */}
      <div className="flex items-center gap-2">
        {isCreatingFolder ? (
          <>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="输入文件夹名称..."
              className="max-w-xs focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFolder}>
              确定
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
            >
              取消
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setIsCreatingFolder(true)} className="flex items-center gap-2">
            <FolderPlus className="size-4" />
            新建文件夹
          </Button>
        )}
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <div key={folder.id} className="rounded-lg bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 flex-1" onClick={() => toggleFolder(folder.id)}>
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              <Folder className="size-4" style={{ color: folder.color }} />
              <span className="font-medium">{folder.name}</span>
              <span className="text-xs text-muted-foreground">
                ({filesByFolder[folder.id]?.length || 0} 个文件)
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="text-destructive">
                  <Trash2 className="size-4 mr-2" />
                  删除文件夹
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {expandedFolders.has(folder.id) && filesByFolder[folder.id] && filesByFolder[folder.id].length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead className="w-[120px] text-right">文件大小</TableHead>
                  <TableHead className="w-[180px]">上传时间</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filesByFolder[folder.id].map((file) => (
                  <TableRow 
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TableCell>
                      {getFileIcon(file.type)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-md" title={file.name}>
                        {file.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(file.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isAudioFile(file.type, file.name) && (
                            <>
                              <DropdownMenuItem onClick={() => handleTranscribeAudio(file)}>
                                <FileType className="size-4 mr-2 text-purple-600" />
                                转为文字
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleMoveFile(file.id, undefined)}>
                            <FolderInput className="size-4 mr-2" />
                            移至未分类
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {folders.filter(f => f.id !== folder.id).map(targetFolder => (
                            <DropdownMenuItem
                              key={targetFolder.id}
                              onClick={() => handleMoveFile(file.id, targetFolder.id)}
                            >
                              <Folder className="size-4 mr-2" style={{ color: targetFolder.color }} />
                              移至 {targetFolder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}

      {/* Uncategorized Files */}
      {uncategorizedFiles.length > 0 && (
        <div className="rounded-lg bg-card overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 flex items-center gap-2">
            <Folder className="size-4 text-muted-foreground" />
            <span className="font-medium">未分类文件</span>
            <span className="text-xs text-muted-foreground">
              ({uncategorizedFiles.length} 个文件)
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>文件名</TableHead>
                <TableHead className="w-[120px] text-right">文件大小</TableHead>
                <TableHead className="w-[180px]">上传时间</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uncategorizedFiles.map((file) => (
                <TableRow 
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TableCell>
                    {getFileIcon(file.type)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-md" title={file.name}>
                      {file.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(file.createdAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAudioFile(file.type, file.name) && (
                          <>
                            <DropdownMenuItem onClick={() => handleTranscribeAudio(file)}>
                              <FileType className="size-4 mr-2 text-purple-600" />
                              转为文字
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {folders.map(targetFolder => (
                          <DropdownMenuItem
                            key={targetFolder.id}
                            onClick={() => handleMoveFile(file.id, targetFolder.id)}
                          >
                            <Folder className="size-4 mr-2" style={{ color: targetFolder.color }} />
                            移至 {targetFolder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-8">
          暂无上传文件。点击右上角的"一键上传"添加文件。
        </div>
      )}
    </div>
  );
}

