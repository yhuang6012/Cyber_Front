import { useAppStore } from '@/store/useAppStore';
import { getProjectBaseUrl } from './utils';
import type { UploadBpDuplicateStrategy, UploadBpResponse } from './types';

/**
 * 调用后端 BP 上传接口：POST /api/projects/upload_bps
 *
 * - 使用 multipart/form-data
 * - files[]: 多个 PDF 文件
 * - doc_type: 默认为 "bp"
 * - on_duplicate: 可选，重复处理策略（skip / overwrite / error）
 */
export async function uploadBpFiles(
  files: File[],
  options?: {
    doc_type?: string;
    on_duplicate?: UploadBpDuplicateStrategy;
  },
): Promise<UploadBpResponse> {
  if (!files.length) return [];

  const { authToken } = useAppStore.getState();
  if (!authToken) {
    throw new Error('请先登录后再上传 BP 文件');
  }

  const url = `${getProjectBaseUrl()}/api/projects/upload_bps`;

  console.log('[projectApi] uploadBpFiles ->', url, {
    fileCount: files.length,
    names: files.map(f => f.name),
    hasToken: !!authToken,
    doc_type: options?.doc_type ?? 'bp',
    on_duplicate: options?.on_duplicate,
  });

  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  formData.append('doc_type', options?.doc_type ?? 'bp');

  if (options?.on_duplicate) {
    formData.append('on_duplicate', options.on_duplicate);
  }

  const resp = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi] uploadBpFiles failed', resp.status, resp.statusText, text);
    throw new Error(
      `BP 上传接口调用失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  try {
    const data = (await resp.json()) as UploadBpResponse;
    if (!Array.isArray(data)) {
      throw new Error('返回数据格式异常（不是数组）');
    }
    console.log('[projectApi] uploadBpFiles response', data);
    return data;
  } catch (e) {
    console.error('[projectApi] uploadBpFiles parse error', e);
    throw new Error(
      e instanceof Error
        ? `解析 BP 上传接口返回失败: ${e.message}`
        : '解析 BP 上传接口返回失败',
    );
  }
}
