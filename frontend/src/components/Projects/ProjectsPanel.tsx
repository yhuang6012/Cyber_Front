import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import { ProjectDetailSheet } from './ProjectDetailPanel/ProjectDetailSheet';
import { EnhancedUploadDialog } from './CreateProject';
import { ProjectsPanelHeader } from './ProjectsPanelHeader';
import { ProjectsPanelContent } from './ProjectsPanelContent';
import { useFileUpload } from './hooks/useFileUpload';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { filterProjects, sortProjects } from './utils/projectFilters';

export function ProjectsPanel() {
  const { 
    projects, 
    removeProject, 
    updateProject,
    uploadTasks,
    hasActiveUploads,
  } = useAppStore();
  
  const [viewMode, setViewMode] = useState<'cards' | 'files'>('cards');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const handleSaveProject = (updated: ProjectItem) => {
    updateProject(updated.id, updated);
  };

  // Filter and sort projects
  const filteredProjects = filterProjects(projects, searchQuery);
  const sortedProjects = sortProjects(filteredProjects);

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
        projects={sortedProjects}
        searchQuery={searchQuery}
        isDragging={isDragging}
        dropZoneRef={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onCardClick={handleCardClick}
        onDelete={removeProject}
      />

      <ProjectDetailSheet
        project={selectedProject}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveProject}
      />

      <EnhancedUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onProcessFiles={processFiles}
      />
    </Tabs>
  );
}
