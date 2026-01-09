import { ProjectItem } from '@/store/useAppStore';
import type { ProjectStatus } from './types';

/**
 * 获取项目 API 的基础 URL
 */
export function getProjectBaseUrl(): string {
  const base =
    (import.meta as any).env?.VITE_PROJECT_BASE ||
    'https://www.gravaity-cybernaut.top';
  console.log('[projectApi] base url resolved to:', base);
  return String(base).replace(/\/$/, '');
}

/**
 * 标准化项目状态
 */
export const normalizeStatus = (status: any): ProjectStatus => {
  const mapped = String(status || '').toLowerCase();
  
  if (mapped === 'accepted') return 'accepted';
  if (mapped === 'rejected') return 'rejected';
  if (mapped === 'initiated') return 'initiated';
  if (mapped === 'received') return 'received';
  
  return 'received';
};

/**
 * 将后端返回的项目详情映射为 ProjectItem
 */
export const mapDetailToProjectItem = (detail: any, fallback: ProjectItem): ProjectItem => ({
  ...fallback,
  ...detail,
  id: String(detail?.id ?? fallback.id),
  name: detail?.project_name ?? detail?.name ?? fallback.name,
  companyName: detail?.company_name ?? fallback.companyName,
  companyAddress: detail?.company_address ?? fallback.companyAddress,
  projectSource: detail?.project_source ?? fallback.projectSource,
  description: detail?.description ?? fallback.description,
  aiSummary: detail?.ai_summary ?? fallback.aiSummary,
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
