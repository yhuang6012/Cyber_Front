import { ProjectItem } from '@/store/useAppStore';
import { XCircle, Hourglass, CheckCircle2, Rocket } from 'lucide-react';

export const getStatusDisplay = (status: ProjectItem['status']) => {
  switch (status) {
    case 'rejected':
      return { 
        icon: <XCircle className="size-4 text-red-500" />, 
        label: '不受理', 
        color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
        hoverColor: 'hover:bg-red-200 hover:text-red-800 dark:hover:bg-red-900 dark:hover:text-red-300'
      };
    case 'received':
      return { 
        icon: <Hourglass className="size-4" />, 
        label: '待受理', 
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-400',
        hoverColor: 'hover:bg-amber-200 hover:text-amber-800 dark:hover:bg-amber-900 dark:hover:text-amber-300'
      };
    case 'accepted':
      return { 
        icon: <CheckCircle2 className="size-4" />, 
        label: '已受理', 
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        hoverColor: 'hover:bg-emerald-200 hover:text-emerald-800 dark:hover:bg-emerald-900 dark:hover:text-emerald-300'
      };
    case 'initiated':
      return { 
        icon: <Rocket className="size-4" />, 
        label: '已立项', 
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        hoverColor: 'hover:bg-blue-200 hover:text-blue-800 dark:hover:bg-blue-900 dark:hover:text-blue-300'
      };
  }
};

export const getConfirmMessage = (nextStatus: ProjectItem['status']): string => {
  const messages: Record<ProjectItem['status'], string> = {
    accepted: '你确定受理该项目吗？',
    rejected: '你确定不受理该项目吗？',
    initiated: '你确定立项吗？',
    received: '你确定将项目标记为待受理吗？',
  };
  return messages[nextStatus] ?? '确认要更新状态吗？';
};

export const normalizeKeywords = (keywords: string): string[] => {
  return keywords.split(',').map(k => k.trim()).filter(Boolean);
};
