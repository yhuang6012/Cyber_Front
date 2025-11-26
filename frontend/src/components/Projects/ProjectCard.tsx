import { CheckCircle2, Clock, Rocket, Building2, User, Phone, Package, Cpu, TrendingUp, DollarSign, Tag, Trash2, Edit } from 'lucide-react';
import { ProjectItem } from '@/store/useAppStore';

interface ProjectCardProps {
  project: ProjectItem;
  variant: 'detailed' | 'compact';
  onDelete: (id: string) => void;
  onClick: (project: ProjectItem) => void;
}

export function ProjectCard({ project, variant: propVariant, onDelete, onClick }: ProjectCardProps) {
  // Override variant: established and accepted projects always use detailed view
  const variant = (project.status === 'established' || project.status === 'accepted') ? 'detailed' : propVariant;
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    const dragData = {
      id: project.id,
      type: 'project',
      title: project.name,
      content: JSON.stringify({
        name: project.name,
        description: project.description,
        companyName: project.companyName,
        industry: project.industry,
        founderName: project.founderName,
        status: project.status,
      }, null, 2),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getStatusBadge = () => {
    switch (project.status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
            <Clock className="size-3" />
            未受理
          </div>
        );
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-2 py-1 rounded-full">
            <CheckCircle2 className="size-3" />
            已受理
          </div>
        );
      case 'established':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-2 py-1 rounded-full">
            <Rocket className="size-3" />
            已立项
          </div>
        );
    }
  };

  if (variant === 'compact') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={() => onClick(project)}
        className="border border-border rounded-lg p-4 bg-card hover:shadow-md hover:border-primary/50 transition-all cursor-pointer hover:cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold truncate">{project.name}</h3>
              {getStatusBadge()}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {project.companyName && (
                <span className="flex items-center gap-1">
                  <Building2 className="size-3" />
                  {project.companyName}
                </span>
              )}
              {project.founderName && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {project.founderName}
                </span>
              )}
              {project.industry && (
                <span className="truncate">{project.industry}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
              aria-label="删除项目"
              title="删除项目"
            >
              <Trash2 className="size-4" />
            </button>
            <Edit className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant for accepted/established projects
  const getBorderClass = () => {
    switch (project.status) {
      case 'accepted':
        return 'border-green-500/50 ring-1 ring-green-500/20 hover:ring-green-500/30';
      case 'established':
        return 'border-blue-500/50 ring-1 ring-blue-500/20 hover:ring-blue-500/30';
      default:
        return 'border-border';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(project)}
      className={`border rounded-lg p-5 bg-card hover:shadow-md transition-all cursor-pointer hover:cursor-grab active:cursor-grabbing group ${getBorderClass()}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            {getStatusBadge()}
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
            aria-label="删除项目"
            title="删除项目"
          >
            <Trash2 className="size-4" />
          </button>
          <Edit className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {project.companyName && (
          <div className="flex items-start gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium block truncate">{project.companyName}</span>
              {project.industry && <span className="text-xs text-muted-foreground">{project.industry}</span>}
            </div>
          </div>
        )}

        {project.founderName && (
          <div className="flex items-start gap-2 text-sm">
            <User className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">创始人：</span>
              <span className="text-muted-foreground">{project.founderName}</span>
              {project.founderContact && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="size-3" />
                  <span className="text-xs text-muted-foreground truncate">{project.founderContact}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {project.projectLead && (
          <div className="flex items-start gap-2 text-sm">
            <User className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">负责人：</span>
              <span className="text-muted-foreground">{project.projectLead}</span>
            </div>
          </div>
        )}

        {project.coreProduct && (
          <div className="flex items-start gap-2 text-sm">
            <Package className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">核心产品：</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.coreProduct}</p>
            </div>
          </div>
        )}

        {project.coreTechnology && (
          <div className="flex items-start gap-2 text-sm">
            <Cpu className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">核心技术：</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.coreTechnology}</p>
            </div>
          </div>
        )}

        {project.marketSize && (
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">市场空间：</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.marketSize}</p>
            </div>
          </div>
        )}

        {project.fundingStatus && (
          <div className="flex items-start gap-2 text-sm">
            <DollarSign className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">融资情况：</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.fundingStatus}</p>
            </div>
          </div>
        )}
      </div>

      {project.keywords && project.keywords.length > 0 && (
        <div className="flex items-start gap-2 text-sm mt-3 pt-3 border-t border-border">
          <Tag className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {project.keywords.slice(0, 5).map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary"
              >
                {kw}
              </span>
            ))}
            {project.keywords.length > 5 && (
              <span className="text-xs text-muted-foreground self-center">+{project.keywords.length - 5}</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.uploader ? `上传人：${project.uploader}` : '来源：—'}</span>
        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

