import { ProjectItem } from '@/store/useAppStore';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { FileList } from './FileList';
import { cn } from '@/lib/utils';

interface ProjectsPanelContentProps {
  viewMode: 'cards' | 'files';
  projects: ProjectItem[];
  searchQuery: string;
  isDragging: boolean;
  dropZoneRef: React.RefObject<HTMLDivElement | null>;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCardClick: (project: ProjectItem) => void;
  onDelete: (id: string) => void;
}

export function ProjectsPanelContent({
  viewMode,
  projects,
  searchQuery,
  isDragging,
  dropZoneRef,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onCardClick,
  onDelete,
}: ProjectsPanelContentProps) {
  return (
    <div 
      ref={dropZoneRef}
      className={cn(
        "px-6 pb-6 overflow-auto flex-1 relative transition-colors",
        isDragging && "bg-primary/5"
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg m-6 pointer-events-none">
          <div className="text-center">
            <Upload className="size-12 mx-auto mb-3 text-primary" />
            <p className="text-lg font-semibold text-primary">拖放文件到此处上传</p>
            <p className="text-sm text-muted-foreground mt-1">支持多文件/多格式并发上传</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'cards' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-3"
          >
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="size-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm mb-2">
                  还没有项目卡片
                </p>
                <p className="text-xs text-muted-foreground">
                  点击右上角的"上传文件"按钮，或拖拽文件到此处
                </p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant={(project.status === 'initiated' || project.status === 'accepted') ? 'detailed' : 'compact'}
                  onDelete={onDelete}
                  onClick={onCardClick}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="files"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <FileList searchQuery={searchQuery} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
