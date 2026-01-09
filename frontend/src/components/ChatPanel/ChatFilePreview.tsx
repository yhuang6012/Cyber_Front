import { useEffect, useRef, useState } from 'react';
import { Loader2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/store/useAppStore';

// 阿里云 WebOffice SDK 类型
declare global {
  interface Window {
    aliyun?: {
      config: (options: {
        mount: HTMLElement;
        url: string;
        mode?: string;
      }) => {
        setToken: (options: { token: string; timeout: number }) => void;
        on: (event: string, callback: (data: any) => void) => void;
        destroy: () => void;
      };
    };
  }
}

// SDK 加载状态
let sdkLoaded = false;
let sdkLoading = false;
const sdkCallbacks: Array<() => void> = [];

function loadAliyunSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (sdkLoaded && window.aliyun) {
      resolve();
      return;
    }

    sdkCallbacks.push(resolve);

    if (sdkLoading) {
      return;
    }

    sdkLoading = true;
    const script = document.createElement('script');
    script.src = 'https://g.alicdn.com/IMM/office-js/1.1.19/aliyun-web-office-sdk.min.js';
    script.onload = () => {
      console.log('[ChatFilePreview] SDK loaded successfully');
      sdkLoaded = true;
      sdkLoading = false;
      sdkCallbacks.forEach(cb => cb());
      sdkCallbacks.length = 0;
    };
    script.onerror = (e) => {
      sdkLoading = false;
      console.error('[ChatFilePreview] Failed to load Aliyun WebOffice SDK', e);
      reject(new Error('SDK 加载失败'));
    };
    document.head.appendChild(script);
  });
}

interface ChatFilePreviewProps {
  filePreview: NonNullable<ChatMessage['filePreview']>;
}

export function ChatFilePreview({ filePreview }: ChatFilePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<NonNullable<Window['aliyun']>['config']> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!filePreview || !containerRef.current || isCollapsed) {
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const initPreview = async () => {
      try {
        console.log('[ChatFilePreview] Loading SDK...');
        await loadAliyunSDK();

        if (!mounted) return;

        if (!containerRef.current) {
          setError('容器初始化失败');
          setIsLoading(false);
          return;
        }

        if (!window.aliyun) {
          setError('SDK 初始化失败');
          setIsLoading(false);
          return;
        }

        // 销毁之前的实例
        if (instanceRef.current) {
          try {
            instanceRef.current.destroy();
          } catch (e) {
            // ignore
          }
          instanceRef.current = null;
        }

        console.log('[ChatFilePreview] Initializing preview:', filePreview.file_name);

        // 创建新实例
        const instance = window.aliyun.config({
          mount: containerRef.current,
          url: filePreview.weboffice_url,
          mode: 'normal',
        });

        // 设置 token
        const timeout = (filePreview.expires_in_seconds ?? 25 * 60) * 1000;
        instance.setToken({ token: filePreview.access_token, timeout });

        // 监听事件
        instance.on('fileOpen', () => {
          console.log('[ChatFilePreview] File opened');
          if (mounted) {
            setIsLoading(false);
          }
        });

        instance.on('error', (err: any) => {
          console.error('[ChatFilePreview] SDK error:', err);
          if (mounted) {
            setError('文件加载失败');
            setIsLoading(false);
          }
        });

        instanceRef.current = instance;

        // 超时处理
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 15000);

      } catch (err) {
        console.error('[ChatFilePreview] Init error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : '初始化预览失败');
          setIsLoading(false);
        }
      }
    };

    initPreview();

    return () => {
      mounted = false;
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          // ignore
        }
        instanceRef.current = null;
      }
    };
  }, [filePreview, isCollapsed]);

  if (isCollapsed) {
    return (
      <div className="rounded-lg px-3 py-2 bg-muted/30 shadow-sm h-10 mr-8">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="size-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate">{filePreview.file_name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setIsCollapsed(false)}
          >
            展开预览
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-background shadow-sm mr-14">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 h-10">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium truncate">{filePreview.file_name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={() => setIsCollapsed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 预览容器 */}
      <div className="relative" style={{ height: '800px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">加载中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setIsCollapsed(true)}>
                收起
              </Button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          id={`chat-preview-${filePreview.file_id}`}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* 全局样式 */}
      <style>{`
        #chat-preview-${filePreview.file_id} iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
