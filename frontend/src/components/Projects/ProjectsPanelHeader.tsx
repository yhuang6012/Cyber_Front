import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Search, Loader2, FolderPlus, LayoutGrid, FileText } from 'lucide-react';

interface ProjectsPanelHeaderProps {
  viewMode: 'cards' | 'files';
  onViewModeChange: (mode: 'cards' | 'files') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isUploading: boolean;
  activeTaskCount: number;
  onUploadClick: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProjectsPanelHeader({
  viewMode,
  searchQuery,
  onSearchChange,
  isUploading,
  activeTaskCount,
  onUploadClick,
  onFileSelect,
}: ProjectsPanelHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="px-6 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <TabsList>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger 
                  value="cards" 
                  className="cursor-pointer"
                >
                  <LayoutGrid className="size-4" />
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              项目展示
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger 
                  value="files" 
                  className="cursor-pointer"
                >
                  <FileText className="size-4" />
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              文件展示
            </TooltipContent>
          </Tooltip>
        </TabsList>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".csv,.json,.txt,.md,.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
            onChange={onFileSelect}
          />
          <Button 
            variant={isUploading ? "default" : "ghost"} 
            size="sm" 
            onClick={onUploadClick} 
            className="flex items-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                任务追踪 ({activeTaskCount})
              </>
            ) : (
              <>
                <FolderPlus className="size-4" />
                新建项目
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={viewMode === 'cards' ? '搜索项目名称、公司、行业、关键词...' : '搜索文件名...'}
          className="pl-9 h-9"
        />
      </div>
    </div>
  );
}
