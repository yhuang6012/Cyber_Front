import { MessageSquarePlus, NotebookPen, Search } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar';
import { SidebarButton } from './SidebarButton';
import { useAppStore } from '@/store/useAppStore';

interface SidebarMainActionsProps {
  onSearchOpen: () => void;
}

export function SidebarMainActions({ onSearchOpen }: SidebarMainActionsProps) {
  const { clearMessages, isChatExpanded, setChatExpanded, toggleSmartCanvas } = useAppStore();

  const handleStartNewChat = () => {
    clearMessages();
    if (!isChatExpanded) {
      setChatExpanded(true);
    }
  };

  return (
    <SidebarGroup className="p-3">
      <SidebarGroupContent>
        <SidebarMenu>
          {/* 开始聊天 */}
          <SidebarButton
            icon={MessageSquarePlus}
            label="开始聊天"
            onClick={handleStartNewChat}
          />

          {/* 智选 */}
          <SidebarButton
            icon={NotebookPen}
            label="智选"
            onClick={toggleSmartCanvas}
          />

          {/* 搜索 */}
          <SidebarButton
            icon={Search}
            label="搜索"
            onClick={onSearchOpen}
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
