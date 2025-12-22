import { useState } from 'react';
import { useAppStore, ProjectFileItem } from '@/store/useAppStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileText, Folder, ChevronRight, ChevronDown, FileAudio, FileType, Loader2, Eye, Trash2, MoreVertical } from 'lucide-react';
import { getProjectFolders, getProjectFilePreviewUrl } from '@/lib/projectApi';
import { toast } from 'sonner';

function getFileIcon(_fileType: string = '', fileName: string = '') {
  const name = fileName.toLowerCase();
  
  if (name.endsWith('.pdf')) return <FileText className="size-4 text-red-500" />;
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileText className="size-4 text-green-600" />;
  if (name.endsWith('.pptx') || name.endsWith('.ppt')) return <FileText className="size-4 text-orange-500" />;
  if (name.endsWith('.docx') || name.endsWith('.doc')) return <FileText className="size-4 text-blue-600" />;
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a')) return <FileAudio className="size-4 text-purple-600" />;
  if (name.endsWith('.md')) return <FileType className="size-4 text-gray-600" />;
  return <FileText className="size-4 text-muted-foreground" />;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ProjectFilesData {
  projectId: string;
  projectName: string;
  files: ProjectFileItem[];
  loading: boolean;
  error?: string;
}

interface FileListProps {
  searchQuery?: string;
}

export function FileList({ searchQuery = '' }: FileListProps) {
  const { projects, authToken } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [projectFilesMap, setProjectFilesMap] = useState<Record<string, ProjectFilesData>>({});

  // 当项目展开时，加载该项目的文件
  const loadProjectFiles = async (projectId: string) => {
    if (projectFilesMap[projectId]?.files.length > 0) return; // 已加载过
    
    setProjectFilesMap(prev => ({
      ...prev,
      [projectId]: { 
        projectId, 
        projectName: projects.find(p => p.id === projectId)?.name || '', 
        files: [], 
        loading: true 
      }
    }));

    try {
      const result = await getProjectFolders(projectId);
      // API 返回的是 files 数组
      const files = result.files || [];
      setProjectFilesMap(prev => ({
        ...prev,
        [projectId]: {
          projectId,
          projectName: result.project_name || projects.find(p => p.id === projectId)?.name || '',
          files,
          loading: false
        }
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载失败';
      setProjectFilesMap(prev => ({
        ...prev,
        [projectId]: {
          projectId,
          projectName: projects.find(p => p.id === projectId)?.name || '',
          files: [],
          loading: false,
          error: message
        }
      }));
    }
  };

  const toggleFolder = (projectId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
        // 展开时加载文件
        loadProjectFiles(projectId);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, file: ProjectFileItem, projectName: string) => {
    e.stopPropagation();
    const dragData = {
      id: file.id,
      type: 'file',
      title: file.file_name,
      content: JSON.stringify({
        name: file.file_name,
        size: formatFileSize(file.file_size),
        type: file.file_type || '',
        project: projectName,
        url: file.oss_url,
      }, null, 2),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePreviewFile = async (file: ProjectFileItem, projectId: string) => {
    try {
      const { preview_url } = await getProjectFilePreviewUrl(projectId, file.id);
      window.open(preview_url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取预览链接失败';
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    }
  };

  const handleDeleteFile = async (file: ProjectFileItem, projectId: string) => {
    if (!confirm(`确定要删除文件「${file.file_name}」吗？`)) {
      return;
    }
    
    try {
      // TODO: 调用删除文件 API
      // await deleteProjectFile(projectId, file.id);
      
      // 临时：从本地状态中移除
      setProjectFilesMap(prev => {
        const projectData = prev[projectId];
        if (!projectData) return prev;
        return {
          ...prev,
          [projectId]: {
            ...projectData,
            files: projectData.files.filter(f => f.id !== file.id),
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败';
      alert(message);
    }
  };

  // 根据搜索过滤项目
  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    // 搜索项目名或项目内的文件名
    const matchesProjectName = project.name.toLowerCase().includes(query);
    const projectFiles = projectFilesMap[project.id]?.files || [];
    const matchesFileName = projectFiles.some(f => f.file_name.toLowerCase().includes(query));
    return matchesProjectName || matchesFileName;
  });

  // 获取项目文件（过滤后）
  const getFilteredFiles = (projectId: string): ProjectFileItem[] => {
    const files = projectFilesMap[projectId]?.files || [];
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(f => f.file_name.toLowerCase().includes(query));
  };

  // 未登录或无项目时的提示
  if (!authToken) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        请先登录以查看项目文件
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        {searchQuery ? '没有找到匹配的项目或文件' : '暂无项目'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 项目文件夹列表 */}
      {filteredProjects.map((project) => {
        const projectData = projectFilesMap[project.id];
        const isExpanded = expandedFolders.has(project.id);
        const files = getFilteredFiles(project.id);
        const fileCount = projectData?.files.length || 0;
        
        return (
          <div key={project.id} className="rounded-lg bg-card overflow-hidden ">
            {/* 项目文件夹头部 */}
            <div 
              className="flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => toggleFolder(project.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                <Folder className="size-4 text-blue-500" />
                <span className="font-medium">{project.name}</span>
                {projectData?.loading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : projectData && fileCount > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    ({fileCount} 个文件)
                  </span>
                ) : null}
              </div>
            </div>

            {/* 展开时显示文件列表 */}
            {isExpanded && (
              <div>
                {projectData?.loading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mr-2" />
                    加载中...
                  </div>
                ) : projectData?.error ? (
                  <div className="text-center text-destructive text-sm py-4">
                    {projectData.error}
                  </div>
                ) : files.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>文件名</TableHead>
                        <TableHead className="w-[120px] text-right">文件大小</TableHead>
                        <TableHead className="w-[200px] text-right">上传时间</TableHead>
                        <TableHead className="w-[80px] text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow 
                          key={file.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, file, project.name)}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <TableCell>
                            {getFileIcon(file.file_type || '', file.file_name)}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-md" title={file.file_name}>
                              {file.file_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatFileSize(file.file_size)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {file.uploaded_at ? new Date(file.uploaded_at).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-0 shadow-lg">
                                <DropdownMenuItem onClick={() => handlePreviewFile(file, project.id)}>
                                  <Eye className="size-4 mr-2" />
                                  预览
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteFile(file, project.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    此项目暂无文件
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

