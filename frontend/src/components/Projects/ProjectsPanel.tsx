import { useState, useMemo } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import { EnhancedUploadDialog } from './CreateProject';
import { ProjectsPanelHeader } from './ProjectsPanelHeader';
import { ProjectsPanelContent } from './ProjectsPanelContent';
import { useFileUpload } from './hooks/useFileUpload';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useProjectSearch } from './hooks/useProjectSearch';
import { filterProjects, sortProjects } from './utils/projectFilters';

export function ProjectsPanel() {
  const { 
    projects, 
    removeProject, 
    uploadTasks,
    hasActiveUploads,
    setSelectedProjectId,
  } = useAppStore();
  
  const [viewMode, setViewMode] = useState<'cards' | 'files'>('cards');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // 使用后端搜索 hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    hasSearchResults,
  } = useProjectSearch({ debounceMs: 400 });

  const { processFiles } = useFileUpload();

  const handleDropFiles = async (files: File[]) => {
    setUploadDialogOpen(true);
    await processFiles(files);
  };

  const {
    dropZoneRef,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useDragAndDrop(handleDropFiles);

  const handleClickUpload = () => {
    setUploadDialogOpen(true);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    await handleDropFiles(files);
  };

  const handleCardClick = (project: ProjectItem) => {
    setSelectedProjectId(project.id);
  };

  // 当有搜索关键词时使用后端搜索结果，否则使用本地项目列表
  const displayProjects = useMemo(() => {
    if (hasSearchResults && searchQuery.trim()) {
      // 使用后端搜索结果
      return sortProjects(searchResults);
    }
    // 使用本地项目列表（支持本地过滤）
    const filtered = filterProjects(projects, '');
    return sortProjects(filtered);
  }, [hasSearchResults, searchQuery, searchResults, projects]);

  const isUploading = hasActiveUploads();
  const activeTaskCount = uploadTasks.filter(t => t.status === 'uploading' || t.status === 'parsing').length;

  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'files')} className="h-full flex flex-col">
      <ProjectsPanelHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isUploading={isUploading}
        activeTaskCount={activeTaskCount}
        onUploadClick={handleClickUpload}
        onFileSelect={handleFilesSelected}
      />

      <ProjectsPanelContent
        viewMode={viewMode}
        projects={displayProjects}
        searchQuery={searchQuery}
        isSearching={isSearching}
        isDragging={isDragging}
        dropZoneRef={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onCardClick={handleCardClick}
                    onDelete={removeProject}
      />

      <EnhancedUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onProcessFiles={processFiles}
      />
    </Tabs>
  );
}
