import { useState } from 'react';
import { History, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SidebarHistory() {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';
  const [expanded, setExpanded] = useState(true);
  const { chatThreads, threadId, loadThreadMessages, deleteThread, setChatExpanded } = useAppStore();

  const handleThreadClick = async (id: string) => {
    try {
      await loadThreadMessages(id);
      setChatExpanded(true);
    } catch (error) {
      console.error('[SidebarHistory] Failed to load thread:', error);
    }
  };

  const handleDeleteThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条对话记录吗？')) {
      deleteThread(id);
    }
  };

  return (
    <SidebarGroup className="p-3">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors gap-3 px-1 py-2 border border-transparent bg-transparent cursor-pointer font-medium text-sm"
            >
              <History className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 whitespace-nowrap overflow-hidden text-left"
                  >
                    历史对话
                  </motion.span>
                )}
              </AnimatePresence>
              {isExpanded && (
                <motion.div
                  animate={{ rotate: expanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </motion.button>

            <AnimatePresence>
              {isExpanded && expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-1"
                >
                  <div className="space-y-1">
                    {chatThreads.length === 0 ? (
                      <div className="text-xs text-muted-foreground px-1 py-2 text-center">
                        暂无历史对话
                      </div>
                    ) : (
                      chatThreads.map((thread) => (
                        <motion.div
                          key={thread.id}
                          whileHover={{ scale: 1.01 }}
                          className={`group flex items-center gap-2 px-1 py-1 rounded-md text-sm transition-colors cursor-pointer ${
                            threadId === thread.id
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          }`}
                          onClick={() => handleThreadClick(thread.id)}
                        >
                          <div className="flex-1 min-w-0 ml-1">
                            <div className="truncate font-medium leading-tight">
                              {thread.title}
                            </div>
                            {/* <div className="text-xs text-muted-foreground">
                              {format(new Date(thread.createdAt), 'MM-dd HH:mm')}
                            </div> */}
                          </div>
                          {/* 使用 wrapper 并在捕获阶段阻止事件，彻底阻断冒泡 */}
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="border border-border shadow-lg p-1.5"
                                // 避免在菜单内部点击也触发外部逻辑
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuItem 
                                  onClick={(e) => handleDeleteThread(e, thread.id)}
                                  className="text-destructive hover:bg-destructive/5 hover:text-destructive focus:bg-destructive/5 focus:text-destructive"
                                >
                                  <Trash2 className="size-4 mr-2 ml-1 text-destructive" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
