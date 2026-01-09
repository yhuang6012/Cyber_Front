import { useState, useEffect } from 'react';
import { ProjectItem, useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { generateAiSummary, getProjectIntakeDraft } from '@/lib/projectApi';
import { toast } from 'sonner';

interface AiSummarySectionProps {
  project: ProjectItem;
}

export function AiSummarySection({ project }: AiSummarySectionProps) {
  const { updateProject } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);

  // 检查项目是否是最近创建的（5分钟内）
  const isRecentlyCreated = () => {
    if (!project.createdAt) return false;
    const createdTime = new Date(project.createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - createdTime) < fiveMinutes;
  };

  // 获取 AI 摘要文本内容
  const getAiSummaryText = (): string => {
    if (!project.aiSummary) return '';
    if (typeof project.aiSummary === 'string') return project.aiSummary;
    return (project.aiSummary as any)?.text || '';
  };

  // 检查是否有 AI 摘要内容
  const hasAiSummary = () => {
    const text = getAiSummaryText();
    return text.trim().length > 0;
  };

  // 自动轮询获取 AI 摘要（针对新创建的项目）
  useEffect(() => {
    // 如果已有摘要或不是新项目，不需要轮询
    if (hasAiSummary() || !isRecentlyCreated()) {
      setAutoPolling(false);
      return;
    }

    // 开始自动轮询
    setAutoPolling(true);
    console.log('[AiSummarySection] 🔄 开始自动轮询 AI 摘要:', project.id);

    let attempts = 0;
    const maxAttempts = 20; // 最多轮询 100 秒（5秒 x 20次）
    const pollInterval = 5000;

    const poll = async () => {
      attempts++;
      
      try {
        const projectData = await getProjectIntakeDraft(project.id);
        
        if (projectData.ai_summary) {
          // AI 摘要已生成
          console.log('[AiSummarySection] ✅ AI 摘要已获取:', project.id);
          updateProject(project.id, { aiSummary: projectData.ai_summary });
          setAutoPolling(false);
          return;
        }
        
        // 继续轮询
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          console.log('[AiSummarySection] ⏱️ AI 摘要轮询超时:', project.id);
          setAutoPolling(false);
        }
      } catch (error) {
        console.error('[AiSummarySection] ❌ 轮询出错:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setAutoPolling(false);
        }
      }
    };

    // 延迟 3 秒后开始第一次轮询（给后端处理时间）
    const initialDelay = setTimeout(() => {
      poll();
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      setAutoPolling(false);
    };
  }, [project.id, project.aiSummary, project.createdAt]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAutoPolling(false); // 停止自动轮询（如果有的话）
    
    try {
      // 调用 AI 摘要生成 API
      const result = await generateAiSummary(project.id);
      console.log('[AiSummarySection] 手动触发 AI 摘要任务:', result);
      
      toast.success('AI 摘要生成中...', {
        description: '预计需要 10-30 秒',
      });

      // 轮询获取摘要结果
      let attempts = 0;
      const maxAttempts = 20; // 最多等待 100 秒
      const pollInterval = 5000; // 每 5 秒轮询一次

      const poll = async () => {
        attempts++;
        
        try {
          const projectData = await getProjectIntakeDraft(project.id);
          
          if (projectData.ai_summary) {
            // 摘要生成成功
            updateProject(project.id, { aiSummary: projectData.ai_summary });
            toast.success('AI 摘要生成完成！');
            setIsGenerating(false);
            return;
          }
          
          // 如果还没有结果且未超过最大尝试次数，继续轮询
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            // 超时
            toast.info('AI 摘要生成时间较长', {
              description: '请稍后查看',
            });
            setIsGenerating(false);
          }
        } catch (error) {
          console.error('[AiSummarySection] 轮询失败:', error);
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setIsGenerating(false);
          }
        }
      };

      // 开始轮询
      setTimeout(poll, pollInterval);
      
    } catch (error: any) {
      console.error('[AiSummarySection] AI 摘要生成失败:', error);
      toast.error('AI 摘要生成失败', {
        description: error.message || '请稍后重试',
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-foreground/80">
          <Sparkles className="size-3 text-primary" />
          <h3 className="font-semibold text-sm tracking-wide uppercase">AI 自动摘要</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || autoPolling}
          className="gap-1 h-7 text-xs px-2"
        >
          {isGenerating || autoPolling ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              生成中
            </>
          ) : hasAiSummary() ? (
            <>
              <RefreshCw className="size-3" />
              重新生成
            </>
          ) : (
            <>
              <Sparkles className="size-3" />
              生成
            </>
          )}
        </Button>
      </div>
      
      <div>
        {hasAiSummary() ? (
          <div className="p-2.5 rounded-md bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 min-h-[80px]">
            <p className="text-xs leading-relaxed whitespace-pre-wrap">
              {getAiSummaryText()}
            </p>
          </div>
        ) : autoPolling || isGenerating ? (
          <div className="p-2.5 rounded-md bg-muted/40 border border-border/50 min-h-[80px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <p className="text-xs">
                生成中...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-md bg-muted/40 border border-border/50 border-dashed min-h-[80px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground/60 italic text-center">
              点击"生成"按钮生成摘要
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
