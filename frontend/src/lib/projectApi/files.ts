import { useAppStore, ProjectFolderContents } from '@/store/useAppStore';
import { getProjectBaseUrl } from './utils';
import type { ProjectFileInfo, FileDownloadUrlResult, FilePreviewUrlResult } from './types';

/**
 * 获取项目文件夹内容
 * GET /api/projects/{project_id}/folders
 * @param projectIdOrName - 项目ID或项目名称
 * @param folderId - 文件夹ID（可选，不提供时返回根目录）
 */
export async function getProjectFolders(
  projectIdOrName: string,
  folderId?: string,
  tokenOverride?: string,
): Promise<ProjectFolderContents> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    throw new Error('请先登录');
  }

  let url = `${getProjectBaseUrl()}/api/projects/${encodeURIComponent(projectIdOrName)}/folders`;
  if (folderId) {
    url += `?folder_id=${encodeURIComponent(folderId)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '获取文件夹内容失败');
  }

  return response.json();
}

/**
 * 获取项目文件列表
 * GET /api/projects/{project_id}/files
 *
 * - 不传 status：默认返回"当前项目状态下上传的文件"（后端默认行为）
 * - status="all"：返回所有文件（不限定状态）
 * - 也可传具体状态值（received/accepted/initiated/rejected 等）
 * - folder_id：可选，筛选指定文件夹
 */
export async function getProjectFiles(
  projectId: string,
  options?: {
    status?: string;
    folder_id?: string;
  },
  tokenOverride?: string,
): Promise<ProjectFileInfo[]> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.folder_id) params.set('folder_id', options.folder_id);

  const qs = params.toString();
  const url = `${getProjectBaseUrl()}/api/projects/${encodeURIComponent(projectId)}/files${qs ? `?${qs}` : ''}`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`获取项目文件列表失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data: any = await resp.json().catch(() => ({}));
  const files: any[] = Array.isArray(data) ? data : Array.isArray(data?.files) ? data.files : [];

  return files.map((f: any) => ({
    id: String(f.id ?? f.file_id ?? crypto.randomUUID()),
    name: String(f.file_name ?? f.name ?? ''),
    size: Number(f.file_size ?? f.size ?? 0),
    type: String(f.file_type ?? f.type ?? ''),
    createdAt: String(f.uploaded_at ?? f.created_at ?? new Date().toISOString()),
    uploadedBy: f.uploaded_by ?? f.uploaded_by_username,
    projectStatusAtUpload: f.project_status_at_upload,
    raw: f,
  }));
}

/**
 * 删除项目文件
 * DELETE /api/projects/{project_id}/files/{file_id}
 */
export async function deleteProjectFile(
  projectId: string,
  fileId: string,
  tokenOverride?: string,
): Promise<any> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const url = `${getProjectBaseUrl()}/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`删除文件失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await resp.json().catch(() => ({}));
  }
  return await resp.text().catch(() => '');
}

/**
 * 获取项目文件下载 URL（OSS 签名 URL）
 * GET /api/projects/{project_id}/files/{file_id}/download-url
 */
export async function getProjectFileDownloadUrl(
  projectId: string,
  fileId: string,
  tokenOverride?: string,
): Promise<FileDownloadUrlResult> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const url = `${getProjectBaseUrl()}/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/download-url`;
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
    throw new Error(`获取下载链接失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data: any = await resp.json().catch(() => ({}));
  const previewUrl: string | undefined = data?.preview_url ?? data?.url ?? data?.download_url;
  if (!previewUrl) throw new Error('下载接口返回缺少 preview_url');

  return {
    preview_url: String(previewUrl),
    file_name: data?.file_name,
    expires_at: data?.expires_at,
    expires_in_seconds: data?.expires_in_seconds,
    raw: data,
  };
}

/**
 * 获取项目文件预览 URL（OSS office-preview）
 * GET /api/projects/{project_id}/files/{file_id}/preview-url
 * 
 * 支持预览的文件类型：PDF、Word、Excel、PPT 等
 */
export async function getProjectFilePreviewUrl(
  projectId: string,
  fileId: string,
  tokenOverride?: string,
): Promise<FilePreviewUrlResult> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const url = `${getProjectBaseUrl()}/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/preview-url`;
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
    throw new Error(`获取预览链接失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data: any = await resp.json().catch((e) => {
    console.error('[projectApi] getProjectFilePreviewUrl JSON parse error:', e);
    return {};
  });
  console.log('[projectApi] getProjectFilePreviewUrl response:', data);
  
  const previewUrl: string | undefined = data?.preview_url ?? data?.weboffice_url ?? data?.url;
  if (!previewUrl) {
    console.error('[projectApi] getProjectFilePreviewUrl missing preview_url, data:', data);
    throw new Error('预览接口返回缺少 preview_url');
  }

  return {
    preview_url: String(previewUrl),
    weboffice_url: data?.weboffice_url ?? data?.preview_url ?? previewUrl,
    access_token: data?.access_token ?? '',
    refresh_token: data?.refresh_token ?? '',
    file_id: data?.file_id ?? fileId,
    file_name: data?.file_name ?? '',
    file_type: data?.file_type,
    expires_at: data?.expires_at,
    expires_in_seconds: data?.expires_in_seconds ?? data?.ttl_seconds,
    is_fallback: data?.is_fallback ?? false,
    raw: data,
  };
}

/**
 * 上传项目文件
 * POST /api/projects/{proj_id}/files
 * @param projectId - 项目ID
 * @param files - 要上传的文件列表
 * @param folderId - 目标文件夹ID（可选，不提供时上传到根目录）
 * @param onDuplicate - 重复处理策略：'error' | 'overwrite' | 'skip'，默认为 'error'
 * @returns 单个文件返回文件信息对象，多个文件返回文件信息数组（可能包含错误对象）
 */
export async function uploadProjectFiles(
  projectId: string,
  files: File[],
  folderId?: string,
  onDuplicate: 'error' | 'overwrite' | 'skip' = 'error',
  tokenOverride?: string,
): Promise<any> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    throw new Error('请先登录');
  }

  if (files.length === 0) {
    throw new Error('请选择要上传的文件');
  }

  const url = `${getProjectBaseUrl()}/api/projects/${projectId}/files`;
  
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  if (folderId) {
    formData.append('folder_id', folderId);
  }
  
  if (onDuplicate) {
    formData.append('on_duplicate', onDuplicate);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('文件验证失败（文件大小超限或格式不支持）');
    }
    if (response.status === 404) {
      throw new Error('项目不存在或文件夹不存在');
    }
    if (response.status === 409) {
      throw new Error('文件已存在');
    }
    if (response.status === 500) {
      throw new Error('上传失败（服务器内部错误）');
    }
    const errorText = await response.text();
    throw new Error(errorText || '上传失败');
  }

  return await response.json();
}
