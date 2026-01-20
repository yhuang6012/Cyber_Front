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
 * 将后端返回的项目详情映射为 ProjectItem（适配新的API结构）
 */
export const mapDetailToProjectItem = (detail: any, fallback: ProjectItem): ProjectItem => {
  const mapped: ProjectItem = {
  ...fallback,
  id: String(detail?.id ?? fallback.id),
  name: detail?.project_name ?? detail?.name ?? fallback.name,
    // 基础信息
  companyName: detail?.company_name ?? fallback.companyName,
  companyAddress: detail?.company_address ?? fallback.companyAddress,
  projectSource: detail?.project_source ?? fallback.projectSource,
  description: detail?.description ?? fallback.description,
    aiSummary: detail?.ai_summary ?? fallback.aiSummary,
  status: normalizeStatus(detail?.status ?? fallback.status),
  uploader: detail?.uploaded_by_username ?? fallback.uploader,
  projectContact: detail?.project_contact ?? fallback.projectContact,
  contactInfo: detail?.contact_info ?? fallback.contactInfo,
    contact: detail?.contact ?? fallback.contact,
    // 行业分类（三级）
  industry: detail?.industry ?? fallback.industry,
    industry_secondary: detail?.industry_secondary ?? fallback.industry_secondary,
    industry_tertiary: detail?.industry_tertiary ?? fallback.industry_tertiary,
    // 项目信息
    project_stage: detail?.project_stage ?? fallback.project_stage,
    region: detail?.region ?? fallback.region,
    one_liner: detail?.one_liner ?? fallback.one_liner,
    // 新结构的嵌套对象
    core_team: detail?.core_team ?? fallback.core_team,
    product: detail?.product ?? fallback.product,
    technology: detail?.technology ?? fallback.technology,
    market: detail?.market ?? fallback.market,
    competition: detail?.competition ?? fallback.competition,
    financial_status: detail?.financial_status ?? fallback.financial_status,
    financing_history: detail?.financing_history ?? fallback.financing_history,
    highlights: detail?.highlights ?? fallback.highlights,
    // 其他字段
    awards: detail?.awards ?? fallback.awards,
  keywords: detail?.keywords ?? fallback.keywords,
    tags: detail?.tags ?? fallback.tags,
    // 溯源信息
    field_page_idx: detail?.field_page_idx ?? fallback.field_page_idx,
    team_members_text: detail?.team_members_text ?? fallback.team_members_text,
    bp_file: detail?.bp_file ?? fallback.bp_file,
    business_registration: detail?.business_registration ?? fallback.business_registration,
    // 外部工商信息
    company: detail?.company ?? fallback.company,
    field_comparison: detail?.field_comparison ?? (fallback as any).field_comparison,
    // 时间戳
  sourceFileName: detail?.project_source ?? fallback.sourceFileName,
  createdAt: detail?.created_at ?? fallback.createdAt,
  updatedAt: detail?.updated_at ?? fallback.updatedAt,
    
    // ===== 兼容旧字段 =====
    // 如果后端还返回旧字段，也保存；否则尝试从新结构中提取
    coreTeam: detail?.core_team_members ?? fallback.coreTeam,
    coreProduct: detail?.core_product ?? detail?.product?.description ?? fallback.coreProduct,
    coreTechnology: detail?.core_technology ?? detail?.technology?.key_points ?? fallback.coreTechnology,
    competitionAnalysis: detail?.competition_analysis ?? detail?.competition?.differentiation ?? fallback.competitionAnalysis,
    marketSize: detail?.market_size ?? detail?.market?.market_size ?? fallback.marketSize,
    financialStatus: detail?.financial_status ?? fallback.financialStatus,
  };

  return mapped;
};
