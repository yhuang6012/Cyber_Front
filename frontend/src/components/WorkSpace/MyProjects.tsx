import { useState } from 'react';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import { ProjectCard } from '@/components/Projects/ProjectCard';
import { ProjectDetailSheet } from '@/components/Projects/ProjectDetailSheet';
import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';

export function MyProjects() {
  const { projects, removeProject, updateProject, currentUser } = useAppStore();
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filter: only accepted and established projects where projectLead is current user
  const myProjects = projects.filter(
    p => (p.status === 'accepted' || p.status === 'established') && p.projectLead === currentUser
  );

  // Sort: established first, then accepted, then by createdAt desc
  const sortedProjects = [...myProjects].sort((a, b) => {
    const statusPriority = { established: 0, accepted: 1, pending: 2 };
    const priorityA = statusPriority[a.status];
    const priorityB = statusPriority[b.status];
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCardClick = (project: ProjectItem) => {
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const handleSaveProject = (updated: ProjectItem) => {
    updateProject(updated.id, updated);
  };

  return (
    <div className="space-y-4">
      {sortedProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="size-12 mx-auto mb-3 opacity-50" />
          <p className="text-base font-medium">暂无负责的项目</p>
          <p className="text-sm mt-1">前往"项目库"受理新项目</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ProjectCard
                project={project}
                variant="detailed"
                onDelete={removeProject}
                onClick={handleCardClick}
              />
            </motion.div>
          ))}
        </div>
      )}

      <ProjectDetailSheet
        project={selectedProject}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveProject}
      />
    </div>
  );
}

