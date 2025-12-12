import { useAppStore, ProjectItem } from '@/store/useAppStore';

export type UploadBpDuplicateStrategy = 'skip' | 'overwrite' | 'error';

// 单个 BP 文件上传结果（字段根据后端文档和实际返回做了最小约束，其余用索引签名透传）
export interface UploadBpResultItem {
  project_id?: string | number;
  file_id?: string | number;
  pdf_task_id?: string | number;
  status?: string;
  error?: unknown;
  [key: string]: any;
}

export type UploadBpResponse = UploadBpResultItem[];

// PDF 解析任务状态
export interface PdfTaskStatus {
  task_id: string;
  status: string; // 'processing' | 'completed' | ...
  project_id?: string | number;
  extracted_info_url?: string;
  [key: string]: any;
}

export type ExtractedInfo = any;

type ProjectStatus = 'accepted' | 'rejected' | 'initiated' | 'received';

const normalizeStatus = (status: any): ProjectStatus => {
  const mapped = String(status || '').toLowerCase();
  
  // 直接匹配的状态
  if (mapped === 'accepted') return 'accepted';
  if (mapped === 'rejected') return 'rejected';
  if (mapped === 'initiated') return 'initiated';
  if (mapped === 'received') return 'received';
  
  // 默认返回待受理
  return 'received';
};

function getProjectBaseUrl(): string {
  // 允许通过环境变量覆盖，默认使用提供的后端地址
  const base =
    (import.meta as any).env?.VITE_PROJECT_BASE ||
    'https://www.gravaity-cybernaut.top';
  console.log('[projectApi] base url resolved to:', base);
  return String(base).replace(/\/$/, '');
}

/**
 * 登录接口：调用项目后台换取 Token。
 *
 * 默认路径为 `/api/auth/token`，如后端不同可通过 `VITE_AUTH_LOGIN_PATH` 覆盖。
 * 使用 OAuth2 password flow，`application/x-www-form-urlencoded`。
 */
export async function loginWithPassword(params: {
  username: string;
  password: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}): Promise<{ token: string; username: string; role?: string | null; raw: any }> {
  const base = getProjectBaseUrl();
  const path =
    (import.meta as any).env?.VITE_AUTH_LOGIN_PATH || '/api/auth/token';
  const url = `${base}${path}`;

  console.log('[projectApi] login POST', url, { username: params.username, scope: params.scope, client_id: params.client_id });

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: params.username,
      password: params.password,
      ...(params.scope ? { scope: params.scope } : {}),
      ...(params.client_id ? { client_id: params.client_id } : {}),
      ...(params.client_secret ? { client_secret: params.client_secret } : {}),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `登录失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  const data: any = await resp.json();
  const token: string | undefined = data.token ?? data.access_token;

  if (!token) {
    throw new Error('登录接口返回中缺少 token 字段');
  }

  return {
    token,
    username: data.username ?? params.username,
    role: data.role ?? null,
    raw: data,
  };
}

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

  // 后端期望字段名为 files（数组），浏览器会自动按 multipart/form-data 发送
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
      // 业务接口统一在 Header 中携带 Token
      Authorization: `Bearer ${authToken}`,
    },
  });

  // 207 Multi-Status 也会被视作 ok，这里只在非 2xx 时抛错
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi] uploadBpFiles failed', resp.status, resp.statusText, text);
    throw new Error(
      `BP 上传接口调用失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  // 返回预期为 JSON 数组
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

/**
 * 获取项目详情（含 BP 受理单草稿/提取的数据）
 * GET /api/projects/{project_id}
 * 
 * @param projectId - 上传接口返回的 project_id
 */
export async function getProjectIntakeDraft(projectId: string, tokenOverride?: string): Promise<ExtractedInfo> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    throw new Error('请先登录');
  }

  const url = `${getProjectBaseUrl()}/api/projects/${projectId}`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `获取项目数据失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  const data = await resp.json();
  console.log('[getProjectIntakeDraft] 返回结果:', data);
  return data.project;
}

type MyProjectsResponse = {
  projects: Array<{
    id: string | number;
    project_name: string;
    company_name?: string;
    description?: string;
    status?: string;
    uploaded_by?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export const mapDetailToProjectItem = (detail: any, fallback: ProjectItem): ProjectItem => ({
  ...fallback,
  ...detail,
  id: String(detail?.id ?? fallback.id),
  name: detail?.project_name ?? detail?.name ?? fallback.name,
  companyName: detail?.company_name ?? fallback.companyName,
  companyAddress: detail?.company_address ?? fallback.companyAddress,
  projectSource: detail?.project_source ?? fallback.projectSource,
  description: detail?.description ?? fallback.description,
  status: normalizeStatus(detail?.status ?? fallback.status),
  uploader: detail?.uploaded_by_username ?? fallback.uploader,
  projectContact: detail?.project_contact ?? fallback.projectContact,
  contactInfo: detail?.contact_info ?? fallback.contactInfo,
  industry: detail?.industry ?? fallback.industry,
  coreTeam: detail?.core_team ?? fallback.coreTeam,
  coreProduct: detail?.core_product ?? fallback.coreProduct,
  coreTechnology: detail?.core_technology ?? fallback.coreTechnology,
  competitionAnalysis: detail?.competition_analysis ?? fallback.competitionAnalysis,
  marketSize: detail?.market_size ?? fallback.marketSize,
  financialStatus: detail?.financial_status ?? fallback.financialStatus,
  financingHistory: detail?.financing_history ?? fallback.financingHistory,
  keywords: detail?.keywords ?? fallback.keywords,
  sourceFileName: detail?.project_source ?? fallback.sourceFileName,
  createdAt: detail?.created_at ?? fallback.createdAt,
  updatedAt: detail?.updated_at ?? fallback.updatedAt,
});

export async function fetchMyProjectsWithDetails(options?: {
  page?: number;
  page_size?: number;
  status?: string;
  company_name?: string;
  token?: string;
}): Promise<ProjectItem[]> {
  const { authToken } = useAppStore.getState();
  const token = options?.token ?? authToken;
  if (!token) throw new Error('请先登录');

  const params = new URLSearchParams();
  params.set('page', String(options?.page ?? 1));
  params.set('page_size', String(options?.page_size ?? 20));
  if (options?.status) params.set('status', options.status);
  if (options?.company_name) params.set('company_name', options.company_name);

  const url = `${getProjectBaseUrl()}/api/projects/my?${params.toString()}`;
  console.log('[projectApi] fetchMyProjectsWithDetails ->', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi] fetchMyProjectsWithDetails failed', resp.status, resp.statusText, text);
    throw new Error(`获取项目列表失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data = (await resp.json()) as MyProjectsResponse;
  if (!Array.isArray(data.projects)) {
    throw new Error('项目列表返回格式异常');
  }

  const mappedList: ProjectItem[] = data.projects.map(p => ({
    id: String(p.id),
    name: p.project_name,
    companyName: p.company_name,
    companyAddress: (p as any)?.company_address,
    projectSource: (p as any)?.project_source,
    description: p.description,
    status: normalizeStatus(p.status),
    uploader: p.uploaded_by ?? p.uploaded_by_username,
    uploaderUsername: p.uploaded_by_username,
    createdAt: p.created_at ?? new Date().toISOString(),
    updatedAt: p.updated_at,
    tags: [],
  }));

  const detailed = await Promise.all(
    mappedList.map(async (item) => {
      try {
        const detail = await getProjectIntakeDraft(String(item.id), token);
        return mapDetailToProjectItem(detail, item);
      } catch (err) {
        console.error('[projectApi] detail fetch failed for', item.id, err);
        return item;
      }
    })
  );

  console.log('[projectApi] fetched projects count:', detailed.length);
  return detailed;
}

/**
 * 立项项目
 * POST /api/projects/{project_id}/initiate
 * 
 * 前置条件：项目状态必须为 accepted
 * 将项目状态从 accepted 变更为 initiated (尽调中)
 * 
 * @param projectId - 项目ID
 */
export async function initiateProject(
  projectId: string,
  tokenOverride?: string,
): Promise<ProjectItem> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    throw new Error('请先登录');
  }

  const url = `${getProjectBaseUrl()}/api/projects/${projectId}/initiate`;

  console.log('[projectApi] initiateProject ->', url);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi] initiateProject failed', resp.status, resp.statusText, text);
    throw new Error(
      `立项失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  const data = await resp.json();
  console.log('[projectApi] initiateProject response', data);

  // 立项接口返回的数据可能不包含完整项目详情，需要重新获取
  // 先获取完整的项目详情
  const fullProjectDetail = await getProjectIntakeDraft(projectId, token);
  
  // 将后端返回的数据映射回 ProjectItem
  return mapDetailToProjectItem(fullProjectDetail, {
    id: projectId,
    name: '',
    status: 'initiated',
    createdAt: new Date().toISOString(),
  } as ProjectItem);
}

/**
 * 更新项目字段和状态
 * PATCH /api/projects/{project_id}
 * 
 * @param projectId - 项目ID
 * @param updates - 要更新的字段
 * @param options - 状态变更选项
 *   - accept: true 表示受理项目（状态变为 accepted）
 *   - reject: true 表示不受理项目（状态变为 rejected），需要提供 description 作为拒绝理由
 */
export async function updateProject(
  projectId: string,
  updates: Partial<ProjectItem> & {
    accept?: boolean;
    reject?: boolean;
  },
  tokenOverride?: string,
): Promise<ProjectItem> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    throw new Error('请先登录');
  }

  const url = `${getProjectBaseUrl()}/api/projects/${projectId}`;

  // 构建请求体，将 ProjectItem 字段映射到后端字段
  const payload: any = {};

  // 状态变更参数
  if (updates.accept === true) {
    payload.accept = true;
  }
  if (updates.reject === true) {
    payload.reject = true;
    // 拒绝时必须提供 description 字段作为拒绝理由
    if (updates.description) {
      payload.description = updates.description;
    } else {
      // 如果没有提供拒绝理由，抛出错误（应该在对话框层面验证）
      throw new Error('拒绝受理时必须提供拒绝理由');
    }
  }

  // 项目字段更新（拒绝时 description 已在上面处理，这里跳过）
  if (updates.name) payload.project_name = updates.name;
  if (updates.companyName) payload.company_name = updates.companyName;
  if (updates.companyAddress) payload.company_address = updates.companyAddress;
  if (updates.projectSource) payload.project_source = updates.projectSource;
  // 只有在非拒绝状态下才更新 description（拒绝时 description 已作为拒绝理由处理）
  if (updates.description && !updates.reject) {
    payload.description = updates.description;
  }
  if (updates.uploader) payload.uploaded_by = updates.uploader;
  if (updates.projectContact) payload.project_contact = updates.projectContact;
  if (updates.contactInfo) payload.contact_info = updates.contactInfo;
  if (updates.industry) payload.industry = updates.industry;
  if (updates.coreTeam) payload.core_team = updates.coreTeam;
  if (updates.coreProduct) payload.core_product = updates.coreProduct;
  if (updates.coreTechnology) payload.core_technology = updates.coreTechnology;
  if (updates.competitionAnalysis) payload.competition_analysis = updates.competitionAnalysis;
  if (updates.marketSize) payload.market_size = updates.marketSize;
  if (updates.financialStatus) payload.financial_status = updates.financialStatus;
  if (updates.financingHistory) payload.financing_history = updates.financingHistory;
  if (updates.keywords) payload.keywords = Array.isArray(updates.keywords) ? updates.keywords : updates.keywords;


  console.log('[projectApi] updateProject ->', url, payload);

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi] updateProject failed', resp.status, resp.statusText, text);
    throw new Error(
      `更新项目失败: ${resp.status} ${resp.statusText || ''} ${text}`,
    );
  }

  const data = await resp.json();
  console.log('[projectApi] updateProject response', data);

  // 将后端返回的数据映射回 ProjectItem
  const project = data.project || data;
  return mapDetailToProjectItem(project, {
    id: projectId,
    name: '',
    status: 'received',
    createdAt: new Date().toISOString(),
  } as ProjectItem);
}

/**
 * 通过 Fetch + ReadableStream 模拟 SSE，以支持在 Header 中传递 Token。
 * GET /api/pdf/sse/tasks?task_ids=uuid1,uuid2,...
 */
export function openPdfTasksSse(
  taskIds: string[],
  handlers: {
    onTaskUpdate: (status: PdfTaskStatus) => void;
    onError?: (error: any) => void;
  },
): { close: () => void } {
  if (!taskIds.length) {
    throw new Error('openPdfTasksSse: taskIds 不能为空');
  }

  const { authToken } = useAppStore.getState();
  const params = new URLSearchParams();
  params.set('task_ids', taskIds.join(','));
  
  // 不需要再在 URL 里传 token，改为 Header 传递
  const url = `${getProjectBaseUrl()}/api/pdf/sse/tasks?${params.toString()}`;

  const controller = new AbortController();
  const signal = controller.signal;

  // 使用 fetch 模拟 EventSource
  void (async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          CacheCheck: 'no-cache',
          Connection: 'keep-alive',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal,
      });

      if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(`SSE Connection failed: ${response.status} ${msg}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        // 保留最后一部分（可能是不完整的）
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          
          const lines = part.split('\n');
          let eventType = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              data = line.slice(5).trim();
            }
          }

          if (eventType === 'task_update' && data) {
            try {
              const parsed = JSON.parse(data) as PdfTaskStatus;
              handlers.onTaskUpdate(parsed);
            } catch (e) {
              console.error('[pdf_sse] JSON parse error', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[pdf_sse] Stream error', err);
        handlers.onError?.(err);
      }
    }
  })();

  return {
    close: () => {
      console.log('[pdf_sse] Closing connection');
      controller.abort();
    },
  };
}
