import { MessageSquarePlus, NotebookPen, Search, CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar';
import { SidebarButton } from './SidebarButton';
import { useAppStore } from '@/store/useAppStore';
import { useSidebar } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarMenuItem } from '@/components/ui/sidebar';

interface SidebarMainActionsProps {
  onSearchOpen: () => void;
}

export function SidebarMainActions({ onSearchOpen }: SidebarMainActionsProps) {
  const { clearMessages, isChatExpanded, setChatExpanded, toggleChat, toggleSmartCanvas } = useAppStore();
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';

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

          {/* 聊天面板展开/收起 */}
          <SidebarMenuItem>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleChat}
              className="w-full flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors gap-3 px-1 py-2 border border-transparent bg-transparent cursor-pointer font-medium text-sm"
            >
              {isChatExpanded ? (
                <CircleArrowRight className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CircleArrowLeft className="w-5 h-5 flex-shrink-0" />
              )}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 whitespace-nowrap overflow-hidden text-left"
                  >
                    {isChatExpanded ? '收起聊天' : '展开聊天'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
