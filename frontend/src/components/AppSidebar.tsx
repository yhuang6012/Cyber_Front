import { motion, AnimatePresence } from 'framer-motion';
import { History, BookText, ChevronRight, User, Settings, ChevronsUpDown, Check } from 'lucide-react';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store/useAppStore';

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { currentUser, setCurrentUser } = useAppStore();
  const isExpanded = state === 'expanded';

  const users = [
    { name: '王芳', email: 'wangfang@example.com' },
    { name: '刘洋', email: 'liuyang@example.com' },
    { name: '陈静', email: 'chenjing@example.com' },
  ];

  const currentUserInfo = users.find(u => u.name === currentUser) || users[0];

  const menuItems = [
    { 
      icon: History, 
      label: '历史对话', 
      id: 'history',
      subItems: [
        { label: 'Today', id: 'today' },
        { label: 'Yesterday', id: 'yesterday' },
        { label: 'Last Week', id: 'lastWeek' }
      ]
    },
    { 
      icon: BookText, 
      label: '我的笔记', 
      id: 'notes',
      subItems: [
        { label: 'Recent Notes', id: 'recent' },
        { label: 'All Notes', id: 'all' },
        { label: 'Favorites', id: 'favorites' }
      ]
    }
  ];

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: isExpanded ? 240 : 60,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="h-screen"
    >
      <Sidebar collapsible="none" className="border-r border-border w-full h-screen bg-sidebar">
        <SidebarHeader className="p-2 pt-2">
          <div className={`flex items-center gap-3 pl-3 h-12`}>
            <div className="flex aspect-square size-5 items-center justify-center rounded bg-primary text-primary-foreground">
              <span className="font-bold text-xs">C</span>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="font-bold whitespace-nowrap">Cybernaut</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SidebarHeader>

        <SidebarContent className="pt-2">
          <SidebarGroup className="p-3">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      className={`w-full flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors gap-3 px-2 py-2 border border-transparent bg-transparent cursor-pointer font-medium text-sm`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 whitespace-nowrap overflow-hidden text-left"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          animate={{
                            rotate: expandedItem === item.id ? 90 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                    
                    <AnimatePresence>
                      {isExpanded && expandedItem === item.id && item.subItems && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-8"
                        >
                          <div className="space-y-1 py-1">
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubButton
                                key={subItem.id}
                                className="w-full text-sm flex items-center gap-2 py-2 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left border border-transparent bg-transparent cursor-pointer font-medium"
                              >
                                {subItem.label}
                              </SidebarMenuSubButton>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter 
          className="p-2 pt-2"
          onMouseEnter={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
          }}
        >
          <DropdownMenu 
            onOpenChange={(open) => {
              if (open) {
                setOpen(true);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={(e) => e.stopPropagation()}
                className={`flex items-center gap-3 pl-3 h-12 w-full rounded-lg hover:bg-accent transition-colors`}
              >
                <div className="flex aspect-square size-6 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  <User className="size-4" />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex-1"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium whitespace-nowrap">{currentUserInfo.name}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{currentUserInfo.email}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isExpanded && (
                  <ChevronsUpDown className="size-4 text-muted-foreground flex-shrink-0 mr-2" />
                )}
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56 border-border/80">
              <DropdownMenuLabel>切换用户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map((user) => (
                <DropdownMenuItem
                  key={user.name}
                  onClick={() => setCurrentUser(user.name)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {currentUser === user.name && (
                    <Check className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="size-4 mr-2" />
                设置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </motion.div>
  );
} 