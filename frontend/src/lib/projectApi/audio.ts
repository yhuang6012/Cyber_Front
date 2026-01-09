import { useAppStore } from '@/store/useAppStore';
import { getProjectBaseUrl } from './utils';

/**
 * 提交长音频转写任务
 * POST /api/audio/transcribe-long
 */
export async function submitLongAudioTranscription(
  params: {
    file_id: string;
    model?: string; // 默认 paraformer-v2
    language_hints?: string[]; // e.g. ["zh"]
    custom_prompt?: string;
  },
  tokenOverride?: string,
): Promise<any> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const url = `${getProjectBaseUrl()}/api/audio/transcribe-long`;
  console.log('[projectApi][audio] submitLongAudioTranscription ->', url, {
    file_id: params.file_id,
    model: params.model ?? 'paraformer-v2',
    language_hints: params.language_hints,
    has_custom_prompt: !!params.custom_prompt,
  });
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'paraformer-v2',
      ...params,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi][audio] submitLongAudioTranscription failed', resp.status, resp.statusText, text);
    throw new Error(`提交音频转写任务失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data = await resp.json().catch(() => ({}));
  console.log('[projectApi][audio] submitLongAudioTranscription response <-', data);
  return data;
}

/**
 * 查询长音频转写任务状态
 * GET /api/audio/transcribe-long/{task_id}?force_sync=true
 */
export async function getLongAudioTranscriptionStatus(
  taskId: string,
  options?: { force_sync?: boolean },
  tokenOverride?: string,
): Promise<any> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const params = new URLSearchParams();
  if (options?.force_sync != null) {
    params.set('force_sync', String(options.force_sync));
  }

  const qs = params.toString();
  const url = `${getProjectBaseUrl()}/api/audio/transcribe-long/${encodeURIComponent(taskId)}${qs ? `?${qs}` : ''}`;
  console.log('[projectApi][audio] getLongAudioTranscriptionStatus ->', url);
  
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi][audio] getLongAudioTranscriptionStatus failed', resp.status, resp.statusText, text);
    throw new Error(`获取音频转写状态失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data = await resp.json().catch(() => ({}));
  console.log('[projectApi][audio] getLongAudioTranscriptionStatus response <-', data);
  return data;
}
