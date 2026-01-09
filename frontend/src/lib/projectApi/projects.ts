import { useAppStore, ProjectItem } from '@/store/useAppStore';
import { getProjectBaseUrl, normalizeStatus, mapDetailToProjectItem } from './utils';
import type { ExtractedInfo, MyProjectsResponse } from './types';

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

/**
 * 触发 AI 摘要生成
 * POST /api/projects/{project_id}/ai-summary/generate
 * 
 * @param projectId - 项目 ID
 * @returns { task_id, status, message }
 */
export async function generateAiSummary(
  projectId: string,
  tokenOverride?: string,
): Promise<{ task_id: string; status: string; message: string }> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    console.error('[projectApi] generateAiSummary: 缺少认证 token');
    throw new Error('请先登录');
  }

  const url = `${getProjectBaseUrl()}/api/projects/${encodeURIComponent(projectId)}/ai-summary/generate`;
  console.log('[projectApi] 🤖 触发 AI 摘要生成:', projectId);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const errorBody = await resp.json().catch(() => ({}));
      const errorMessage = errorBody.detail || errorBody.message || resp.statusText;
      
      if (resp.status === 404) {
        throw new Error('项目不存在');
      } else if (resp.status === 403) {
        throw new Error('无权限');
      } else if (resp.status === 400) {
        throw new Error(errorMessage || '项目数据不足');
      }
      
      console.error('[projectApi] ❌ AI 摘要生成失败:', projectId, resp.status, errorMessage);
      throw new Error(`AI 摘要生成失败: ${errorMessage}`);
    }

    const data = await resp.json();
    console.log('[projectApi] ✅ AI 摘要任务已创建:', projectId, data);
    return data;
  } catch (e: any) {
    console.error('[projectApi] 💥 AI 摘要生成异常:', projectId, e.message, e.stack);
    throw new Error(`生成 AI 摘要时发生错误: ${e.message}`);
  }
}

/**
 * 获取我的项目列表（含详情）
 */
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
 * 搜索项目
 * GET /api/projects/search
 * 
 * 支持模糊匹配中文和英文，同时搜索多个字段
 * 
 * @param query - 单个或多个搜索关键词（最多10个）
 * @param limit - 返回数量，默认20，最大100
 * @param offset - 偏移量，默认0
 */
export async function searchProjects(
  query: string | string[],
  options?: {
    limit?: number;
    offset?: number;
  },
  tokenOverride?: string,
): Promise<{ projects: ProjectItem[]; total: number }> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) throw new Error('请先登录');

  const params = new URLSearchParams();
  
  const queries = Array.isArray(query) ? query : [query];
  queries.forEach(q => {
    if (q.trim()) params.append('query', q.trim());
  });

  if (options?.limit) params.set('limit', String(Math.min(options.limit, 100)));
  if (options?.offset) params.set('offset', String(options.offset));

  const url = `${getProjectBaseUrl()}/api/projects/search?${params.toString()}`;
  console.log('[projectApi] searchProjects ->', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[projectApi] searchProjects failed', resp.status, resp.statusText, text);
    throw new Error(`搜索项目失败: ${resp.status} ${resp.statusText || ''} ${text}`);
  }

  const data: any = await resp.json();
  const projects: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.projects) ? data.projects : [];
  const total = data?.total ?? projects.length;

  const mappedProjects: ProjectItem[] = projects.map((p: any) => ({
    id: String(p.id),
    name: p.project_name ?? p.name ?? '',
    companyName: p.company_name,
    companyAddress: p.company_address,
    projectSource: p.project_source,
    description: p.description,
    status: normalizeStatus(p.status),
    uploader: p.uploaded_by ?? p.uploaded_by_username,
    uploaderUsername: p.uploaded_by_username,
    projectContact: p.project_contact,
    contactInfo: p.contact_info,
    industry: p.industry,
    coreTeam: p.core_team,
    coreProduct: p.core_product,
    coreTechnology: p.core_technology,
    competitionAnalysis: p.competition_analysis,
    marketSize: p.market_size,
    financialStatus: p.financial_status,
    financingHistory: p.financing_history,
    keywords: p.keywords,
    createdAt: p.created_at ?? new Date().toISOString(),
    updatedAt: p.updated_at,
    tags: [],
  }));

  console.log('[projectApi] searchProjects result count:', mappedProjects.length);
  return { projects: mappedProjects, total };
}

/**
 * 立项项目
 * POST /api/projects/{project_id}/initiate
 * 
 * 前置条件：项目状态必须为 accepted
 * 将项目状态从 accepted 变更为 initiated (尽调中)
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

  const fullProjectDetail = await getProjectIntakeDraft(projectId, token);
  
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

  const payload: any = {};

  if (updates.accept === true) {
    payload.accept = true;
  }
  if (updates.reject === true) {
    payload.reject = true;
    if (updates.description) {
      payload.description = updates.description;
    } else {
      throw new Error('拒绝受理时必须提供拒绝理由');
    }
  }

  if (updates.name) payload.project_name = updates.name;
  if (updates.companyName) payload.company_name = updates.companyName;
  if (updates.companyAddress) payload.company_address = updates.companyAddress;
  if (updates.projectSource) payload.project_source = updates.projectSource;
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

  const project = data.project || data;
  return mapDetailToProjectItem(project, {
    id: projectId,
    name: '',
    status: 'received',
    createdAt: new Date().toISOString(),
  } as ProjectItem);
}

/**
 * 删除项目
 * DELETE /api/projects/{project_id}
 * @param projectId - 项目ID
 * @param deletionReason - 删除原因（可选）
 * @returns 删除成功返回 true
 * @throws 403 Forbidden - 用户没有 admin 权限
 * @throws 404 Not Found - 项目不存在
 */
export async function deleteProject(
  projectId: string,
  deletionReason?: string,
  tokenOverride?: string,
): Promise<boolean> {
  const { authToken } = useAppStore.getState();
  const token = tokenOverride ?? authToken;
  if (!token) {
    throw new Error('请先登录');
  }

  let url = `${getProjectBaseUrl()}/api/projects/${projectId}`;
  
  if (deletionReason) {
    url += `?deletion_reason=${encodeURIComponent(deletionReason)}`;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error('无删除权限');
    }
    const errorText = await response.text();
    throw new Error(errorText || '删除失败');
  }

  return true;
}
