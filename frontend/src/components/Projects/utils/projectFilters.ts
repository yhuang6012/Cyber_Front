import { ProjectItem } from '@/store/useAppStore';

export function filterProjects(projects: ProjectItem[], searchQuery: string): ProjectItem[] {
  if (!searchQuery.trim()) return projects;
  
  const query = searchQuery.toLowerCase();
  return projects.filter(project => (
    project.name.toLowerCase().includes(query) ||
    project.description?.toLowerCase().includes(query) ||
    project.companyName?.toLowerCase().includes(query) ||
    project.industry?.toLowerCase().includes(query) ||
    project.projectContact?.toLowerCase().includes(query) ||
    project.keywords?.some(k => k.toLowerCase().includes(query))
  ));
}

export function sortProjects(projects: ProjectItem[]): ProjectItem[] {
  const statusPriority: Record<string, number> = { 
    initiated: 1, 
    accepted: 2, 
    rejected: 3, 
    received: 0 
  };
  
  return [...projects].sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 3;
    const priorityB = statusPriority[b.status] ?? 3;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
