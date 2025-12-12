import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronsUpDown, LogOut } from 'lucide-react';
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
import { SidebarFooter } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppStore } from '@/store/useAppStore';
import { loginWithPassword, fetchMyProjectsWithDetails } from '@/lib/projectApi';

export function SidebarUser() {
  const { state, setOpen } = useSidebar();
  const isExpanded = state === 'expanded';
  const [loginUsername, setLoginUsername] = useState('project_manager');
  const [loginPassword, setLoginPassword] = useState('manager1');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { authToken, authUser, setAuthToken, setAuthUser, setProjects, logout } = useAppStore();
  const currentUserInfo = authUser ?? { username: '未登录', role: null };

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
        console.error('[SidebarUser] fetch projects after login failed', err);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
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
  );
}
