import { useAppStore } from '@/store/useAppStore';
import { getProjectBaseUrl } from './utils';
import type { PdfTaskStatus } from './types';

/**
 * 查询 PDF 解析任务状态
 * GET /api/pdf/tasks/{task_id}
 */
export async function getPdfTaskStatus(
  taskId: string,
  tokenOverride?: string,
  signal?: AbortSignal,
): Promise<any> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const url = `${getProjectBaseUrl()}/api/pdf/tasks/${encodeURIComponent(taskId)}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
    cache: 'no-store',
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `获取 PDF 任务状态失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  return await resp.json();
}

/**
 * 取消 BP PDF 解析任务
 * POST /api/pdf/tasks/{task_id}/cancel
 */
export async function cancelPdfTask(
  taskId: string,
  tokenOverride?: string,
): Promise<{ success: boolean; message?: string }> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  console.log('[PDF API] 🛑 取消 PDF 任务:', taskId);

  const url = `${getProjectBaseUrl()}/api/pdf/tasks/${encodeURIComponent(taskId)}/cancel`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[PDF API] ❌ 取消 PDF 任务失败:', {
      taskId,
      status: resp.status,
      statusText: resp.statusText,
      response: text,
    });
    throw new Error(
      `取消 PDF 任务失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  const result = await resp.json();
  console.log('[PDF API] ✅ PDF 任务已取消:', taskId, result);
  return result;
}

/**
 * 轮询 PDF 解析任务状态（替代 SSE）
 *
 * - 每 intervalMs 查询一次 GET /api/pdf/tasks/{task_id}
 * - 轮询到 completed/failed 后自动停止该 task 的轮询
 * - progress 为前端估算值（便于驱动进度条）
 */
export function openPdfTasksPolling(
  taskIds: string[],
  handlers: {
    onTaskUpdate: (status: PdfTaskStatus) => void;
    onError?: (error: any) => void;
  },
  options?: {
    intervalMs?: number;
  },
): { close: () => void } {
  if (!taskIds.length) throw new Error('openPdfTasksPolling: taskIds 不能为空');

  const { authToken } = useAppStore.getState();
  if (!authToken) throw new Error('openPdfTasksPolling: 请先登录（缺少 authToken）');

  const intervalMs = Math.max(1000, Number(options?.intervalMs ?? 5000));
  const controller = new AbortController();
  const signal = controller.signal;

  let closed = false;
  let inFlight = false;
  const done = new Set<string>();
  const progressMap = new Map<string, number>();

  const computeNextProgress = (taskId: string, status: string) => {
    const current = progressMap.get(taskId) ?? 0;
    const s = String(status || '').toLowerCase();

    if (s === 'completed') return 100;
    if (s === 'failed' || s === 'failed_permanently' || s === 'error') return current;
    if (s === 'pending') return Math.max(current, 10);
    // processing / others
    return Math.min(95, Math.max(current, 10) + 7);
  };

  const tick = async () => {
    if (closed || inFlight) return;
    const remaining = taskIds.filter(id => !done.has(id));
    if (remaining.length === 0) return;

    inFlight = true;
    try {
      await Promise.all(
        remaining.map(async (taskId) => {
          try {
            const data: any = await getPdfTaskStatus(taskId, authToken, signal);
            const status = String(data?.status ?? '');
            const nextProgress = computeNextProgress(taskId, status);
            progressMap.set(taskId, nextProgress);

            const update: PdfTaskStatus = {
              task_id: String(data?.task_id ?? taskId),
              status,
              project_id: data?.project_id,
              extracted_info_url: data?.extracted_info_url ?? data?.extracted_info_url,
              progress: nextProgress,
              ...data,
            };
            handlers.onTaskUpdate(update);

            const s = status.toLowerCase();
            if (s === 'completed' || s === 'failed' || s === 'failed_permanently' || s === 'error') {
              done.add(taskId);
            }
          } catch (e) {
            handlers.onError?.(e);
          }
        }),
      );
    } finally {
      inFlight = false;
    }
  };

  void tick();
  const timer = window.setInterval(() => {
    void tick();
  }, intervalMs);

  return {
    close: () => {
      closed = true;
      window.clearInterval(timer);
      controller.abort();
    },
  };
}
