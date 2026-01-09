import { useAppStore } from '@/store/useAppStore';
import { getProjectBaseUrl } from './utils';
import type { VisionAnalyzeResponse } from './types';

/**
 * 提交视觉理解分析任务
 * POST /api/vision/analyze
 * 
 * 支持对图片、视频、PDF 进行视觉理解分析
 */
export async function analyzeVision(
  params: {
    file_ids: string[];
    query?: string;
    stream?: boolean;
  },
  tokenOverride?: string,
): Promise<VisionAnalyzeResponse> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const url = `${getProjectBaseUrl()}/api/vision/analyze`;
  console.log('[projectApi][vision] analyzeVision ->', url, {
    file_ids: params.file_ids,
    query: params.query,
    stream: params.stream ?? false,
  });
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      stream: false,
      ...params,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi][vision] analyzeVision failed', resp.status, resp.statusText, text);
    throw new Error(`提交视觉分析任务失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data = await resp.json().catch(() => ({}));
  console.log('[projectApi][vision] analyzeVision response <-', data);
  return data as VisionAnalyzeResponse;
}

/**
 * 获取视觉分析事件流 URL
 */
export function getVisionEventsUrl(taskIdOrUrl: string, lastId?: string): string {
  const baseUrl = getProjectBaseUrl().replace(/\/$/, '');
  
  // 如果 taskIdOrUrl 包含路径，则直接使用，否则拼接默认路径
  const path = taskIdOrUrl.startsWith('/') ? taskIdOrUrl : `/api/vision/events/${encodeURIComponent(taskIdOrUrl)}`;
  let url = `${baseUrl}${path}`;
  
  if (lastId && lastId !== '0-0') {
    url += (url.includes('?') ? '&' : '?') + `last_id=${encodeURIComponent(lastId)}`;
  }
  
  return url;
}
