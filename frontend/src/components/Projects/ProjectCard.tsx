import { useState } from 'react';
import { CheckCircle2, XCircle, Rocket, Hourglass, Building2, User, Phone, Package, Cpu, TrendingUp, DollarSign, Tag, Trash2 } from 'lucide-react';
import { ProjectItem } from '@/store/useAppStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteProject } from '@/lib/projectApi';

interface ProjectCardProps {
  project: ProjectItem;
  variant?: 'detailed' | 'compact';
  onDelete: (id: string) => void;
  onClick: (project: ProjectItem) => void;
}

export function ProjectCard({ project, variant = 'compact', onDelete, onClick }: ProjectCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      setDeleteDialogOpen(false);
    onDelete(project.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败';
      alert(message);
    } finally {
      setIsDeleting(false);
    }
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
        projectContact: project.projectContact,
        status: project.status,
      }, null, 2),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getStatusBadge = () => {
    switch (project.status) {
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
            <XCircle className="size-3" />
            不受理
          </div>
        );
      case 'received':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded-full flex-shrink-0">
            <Hourglass className="size-3" />
            待受理
          </div>
        );
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-2 py-1 rounded-full">
            <CheckCircle2 className="size-3" />
            已受理
          </div>
        );
      case 'initiated':
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
        className="border border-border rounded-lg p-4 bg-card hover:shadow-md hover:border-primary/50 transition-all cursor-pointer hover:cursor-grab active:cursor-grabbing group"
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
              {project.projectContact && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {project.projectContact}
                </span>
              )}
              {project.industry && (
                <span className="truncate">{project.industry}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDeleteClick}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
              aria-label="删除项目"
              title="删除项目"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除项目「{project.name}」吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="border border-destructive bg-white text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? '删除中...' : '删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Detailed variant for accepted/initiated projects
  const getBorderClass = () => {
    switch (project.status) {
      case 'accepted':
        return 'border-green-500/50 ring-1 ring-green-500/20 hover:ring-green-500/30';
      case 'initiated':
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
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
            aria-label="删除项目"
            title="删除项目"
          >
            <Trash2 className="size-4" />
          </button>
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

        {project.projectContact && (
          <div className="flex items-start gap-2 text-sm">
            <User className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">联系人：</span>
              <span className="text-muted-foreground">{project.projectContact}</span>
              {project.contactInfo && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="size-3" />
                  <span className="text-xs text-muted-foreground truncate">{project.contactInfo}</span>
                </div>
              )}
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

        {project.financingHistory?.current_funding_need && (
          <div className="flex items-start gap-2 text-sm">
            <DollarSign className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">融资需求：</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.financingHistory.current_funding_need}</p>
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
        <div className="flex items-center gap-3">
          {project.uploader && <span>上传人：{project.uploader}</span>}
          {project.projectSource && (
            <>
              {project.uploader && <span className="text-muted-foreground/50">|</span>}
              <span>来源：{project.projectSource}</span>
            </>
          )}
        </div>
        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除项目「{project.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="border border-destructive bg-white text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
