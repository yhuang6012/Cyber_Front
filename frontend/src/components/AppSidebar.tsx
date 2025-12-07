import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronRight, User, ChevronsUpDown, LogOut } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { loginWithPassword, fetchMyProjectsWithDetails } from '@/lib/projectApi';

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('project_manager');
  const [loginPassword, setLoginPassword] = useState('manager1');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { authToken, authUser, setAuthToken, setAuthUser, setProjects, logout } = useAppStore();
  const isExpanded = state === 'expanded';

  const currentUserInfo = authUser ?? { username: '未登录', role: null };

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
    }
  ];

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await loginWithPassword({
        username: loginUsername,
        password: loginPassword,
      });
      setAuthToken(res.token);
      setAuthUser({ username: res.username, role: res.role ?? null });
      try {
        const projects = await fetchMyProjectsWithDetails({ token: res.token, page_size: 50 });
        setProjects(projects);
      } catch (err) {
        console.error('[AppSidebar] fetch projects after login failed', err);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  return (
    <motion.div
      id="app-sidebar"
      initial={false}
      animate={{
        width: isExpanded ? 240 : 50,
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
          <div className={`flex items-center gap-3 pl-1 ml-1 h-12`}>
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
                      className={`w-full flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors gap-3 px-1 py-2 border border-transparent bg-transparent cursor-pointer font-medium text-sm`}
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
                className={`flex items-center gap-3 pl-2 h-12 w-full rounded-lg hover:bg-accent transition-colors`}
              >
                <div className="flex aspect-square size-5 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  <User className="size-3" />
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
                        <p className="text-sm font-medium whitespace-nowrap">
                          {currentUserInfo.username}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {authToken ? currentUserInfo.role || '已登录' : '点击登录以使用后台服务'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isExpanded && (
                  <ChevronsUpDown className="size-4 text-muted-foreground flex-shrink-0 mr-2" />
                )}
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-64 border-border/80">
              {authToken ? (
                <>
                  <DropdownMenuLabel>当前用户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{currentUserInfo.username}</div>
                    {currentUserInfo.role && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        角色：{currentUserInfo.role}
                      </div>
                    )}
                  </div>
              <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => logout()}
                  >
                    <LogOut className="size-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </>
              ) : (
                <form onSubmit={handleLogin} className="px-3 py-2 space-y-2">
                  <DropdownMenuLabel>用户登录</DropdownMenuLabel>
                  <div className="space-y-1">
                    <Input
                      placeholder="用户名"
                      autoComplete="username"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                    />
                    <Input
                      type="password"
                      placeholder="密码"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                  </div>
                  {loginError && (
                    <div className="text-xs text-red-600 whitespace-pre-wrap">
                      {loginError}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[10px] text-muted-foreground">
                      测试账号：project_manager / manager1
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={loginLoading}
                    >
                      {loginLoading ? '登录中...' : '登录'}
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="text-[10px] text-muted-foreground">
                    global_manager / manager2 具备 global_admin 权限
                  </div>
                </form>
                  )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </motion.div>
  );
} 
