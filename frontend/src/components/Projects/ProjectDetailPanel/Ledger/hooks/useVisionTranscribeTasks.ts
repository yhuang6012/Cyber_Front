import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeVision, getVisionEventsUrl, VisionEventData } from '@/lib/projectApi';
import { useAppStore } from '@/store/useAppStore';

export type VisionTranscribeTaskStatus =
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'submitted'
  | 'cancelled';

export type VisionTranscribeTask = {
  taskId: string;
  fileIds: string[];
  fileName: string;
  status: VisionTranscribeTaskStatus;
  progress: number;
  updatedAt: string;
  raw?: any;
  result?: string;
  currentStep?: string;
  lastEventId: string;
};

export function useVisionTranscribeTasks(options: {
  onAnyTaskSucceeded?: () => void;
}) {
  const [tasks, setTasks] = useState<VisionTranscribeTask[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const hasActive = useMemo(
    () => tasks.some(t => ['submitted', 'queued', 'processing'].includes(t.status)),
    [tasks],
  );

  const stopTaskEvents = useCallback((taskId: string) => {
    const controller = abortControllers.current.get(taskId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(taskId);
    }
  }, []);

  const fetchSSE = useCallback(async (taskId: string, eventsUrl: string, retryCount = 0) => {
    if (abortControllers.current.has(taskId)) return;

    const controller = new AbortController();
    abortControllers.current.set(taskId, controller);

    const { authToken } = useAppStore.getState();
    
    // 使用 Ref 或直接在 fetch 之前获取最新的 tasks 状态是不推荐的，
    // 这里我们只需要初始的 lastId，由于 fetchSSE 是在任务提交后立即（或延迟后）调用的，
    // 此时 lastEventId 肯定为 '0-0'。后续重连逻辑可以在错误处理中实现。
    const lastId = '0-0'; 
    
    const url = getVisionEventsUrl(eventsUrl || taskId, lastId);

    try {
      console.log(`[vision_transcribe] Connecting SSE: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`, // 文档要求 Bearer 格式
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      });

      // 404 智能重试
      if (response.status === 404 && retryCount < 3) {
        console.log(`[vision_transcribe] SSE 404, retrying in 1s... (${retryCount + 1}/3)`);
        
        // 更新 UI 状态，告知用户正在等待 Worker 启动
        setTasks(prev => prev.map(t => 
          t.taskId === taskId 
            ? { ...t, currentStep: `等待服务启动... (${retryCount + 1}/3)` } 
            : t
        ));

        abortControllers.current.delete(taskId);
        setTimeout(() => fetchSSE(taskId, eventsUrl, retryCount + 1), 1000);
        return;
      }

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status} ${response.statusText}`);
      }

      console.log('[vision_transcribe] SSE connection established');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = 'message';
      let eventDataStr = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[vision_transcribe] SSE stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('event:')) {
            eventType = trimmedLine.substring(6).trim();
          } else if (trimmedLine.startsWith('data:')) {
            eventDataStr = trimmedLine.substring(5).trim();
          } else if (trimmedLine === '') {
            // 空行表示事件结束，处理收集到的事件数据
            if (eventDataStr) {
              try {
                const eventData: VisionEventData = JSON.parse(eventDataStr);
                console.log(`[vision_transcribe] Event [${eventType}]:`, eventData);

                setTasks(prev => prev.map(t => {
                  if (t.taskId !== taskId) return t;

                  let newStatus = t.status;
                  let newProgress = t.progress;
                  let result = t.result;
                  let currentStep = t.currentStep;
                  const newLastId = eventData.message_id || t.lastEventId;

                  switch (eventData.type) {
                    case 'start':
                      newStatus = 'queued';
                      newProgress = 5;
                      currentStep = '任务开始';
                      break;
                    case 'file_start':
                      newStatus = 'processing';
                      currentStep = `开始处理文件: ${eventData.data?.file_name || '文件'}`;
                      break;
                    case 'pdf_convert':
                      newProgress = Math.max(newProgress, 10 + (eventData.data?.current_page / (eventData.data?.total_pages || 1)) * 20);
                      currentStep = `PDF转换进度: ${eventData.data?.current_page}/${eventData.data?.total_pages}`;
                      break;
                    case 'api_call':
                      newProgress = Math.max(newProgress, 40);
                      currentStep = `调用 AI 模型: ${eventData.data?.model || '模型'}`;
                      break;
                    case 'file_done':
                      newProgress = Math.max(newProgress, 80);
                      currentStep = `文件处理完成: ${eventData.data?.file_name}`;
                      break;
                    case 'progress':
                      if (eventData.data?.progress != null) {
                        newProgress = Number(eventData.data.progress);
                      }
                      if (eventData.data?.message) {
                        currentStep = eventData.data.message;
                      }
                      break;
                    case 'complete':
                      newStatus = 'succeeded';
                      newProgress = 100;
                      // 适配示例中的数据结构 msg.data.result.content
                      result = eventData.data?.result?.content || eventData.data?.markdown_content || eventData.data?.result;
                      currentStep = '分析完成';
                      stopTaskEvents(taskId);
                      if (options.onAnyTaskSucceeded) options.onAnyTaskSucceeded();
                      break;
                    case 'error':
                      newStatus = 'failed';
                      currentStep = `任务失败: ${eventData.data?.error || eventData.data?.message || '未知错误'}`;
                      stopTaskEvents(taskId);
                      break;
                    case 'cancelled':
                      newStatus = 'cancelled';
                      currentStep = '任务已取消';
                      stopTaskEvents(taskId);
                      break;
                  }

                  return {
                    ...t,
                    status: newStatus as VisionTranscribeTaskStatus,
                    progress: newProgress,
                    result,
                    currentStep,
                    lastEventId: newLastId,
                    updatedAt: new Date().toISOString(),
                    raw: { ...t.raw, ...eventData },
                  };
                }));

                // 重置临时变量
                eventDataStr = '';
                eventType = 'message';
              } catch (err) {
                console.error('[vision_transcribe] SSE parse error:', err, eventDataStr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[vision_transcribe] SSE aborted:', taskId);
      } else {
        console.error('[vision_transcribe] SSE error:', err);
        setTasks(prev => prev.map(t => 
          t.taskId === taskId ? { ...t, status: 'failed', updatedAt: new Date().toISOString() } : t
        ));
      }
      abortControllers.current.delete(taskId);
    }
  }, [options, stopTaskEvents]);

  const startTaskForFile = useCallback(async (file: { fileId: string; fileName: string; customPrompt?: string }) => {
    const resp = await analyzeVision({
      file_ids: [file.fileId],
      query: file.customPrompt,
      stream: false,
    });

    const taskId = resp.task_id;
    const eventsUrl = resp.events_url;
    if (!taskId) throw new Error('视觉分析任务提交成功但未返回 task_id');

    const task: VisionTranscribeTask = {
      taskId,
      fileIds: [file.fileId],
      fileName: file.fileName,
      status: 'submitted',
      progress: 0,
      updatedAt: new Date().toISOString(),
      raw: resp,
      currentStep: '正在提交任务...',
      lastEventId: '0-0',
    };

    setTasks(prev => [task, ...prev]);
    
    // 延迟 800ms 再发起第一次 SSE 连接，给后端 Worker 留出一点启动时间
    // 避免因为连接太快导致的初始 404
    setTimeout(() => {
      fetchSSE(taskId, eventsUrl);
    }, 800);
    
    return taskId;
  }, [fetchSSE]);

  useEffect(() => {
    return () => {
      abortControllers.current.forEach(ac => ac.abort());
      abortControllers.current.clear();
    };
  }, []);

  return {
    tasks,
    hasActive,
    startTaskForFile,
  };
}
