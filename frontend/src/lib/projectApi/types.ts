import { ProjectItem } from '@/store/useAppStore';

// ============== BP 上传相关类型 ==============

export type UploadBpDuplicateStrategy = 'skip' | 'overwrite' | 'error';

/** 单个 BP 文件上传结果 */
export interface UploadBpResultItem {
  project_id?: string | number;
  file_id?: string | number;
  pdf_task_id?: string | number;
  status?: string;
  error?: unknown;
  [key: string]: any;
}

export type UploadBpResponse = UploadBpResultItem[];

// ============== PDF 任务相关类型 ==============

/** PDF 解析任务状态 */
export interface PdfTaskStatus {
  task_id: string;
  status: string; // 'processing' | 'completed' | ...
  project_id?: string | number;
  extracted_info_url?: string;
  progress?: number; // 0-100（前端轮询估算进度）
  [key: string]: any;
}

export type ExtractedInfo = any;

// ============== 项目相关类型 ==============

export type ProjectStatus = 'accepted' | 'rejected' | 'initiated' | 'received';

export type MyProjectsResponse = {
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

// ============== 文件相关类型 ==============

export interface ProjectFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  uploadedBy?: string;
  projectStatusAtUpload?: string;
  raw: any;
}

export interface FileDownloadUrlResult {
  preview_url: string;
  file_name?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  raw: any;
}

export interface FilePreviewUrlResult {
  preview_url: string;
  weboffice_url: string;
  access_token: string;
  refresh_token: string;
  file_id: string;
  file_name: string;
  file_type?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  is_fallback: boolean;
  raw: any;
}

// ============== 视觉分析相关类型 ==============

/** 视觉分析任务响应 */
export interface VisionAnalyzeResponse {
  task_id: string;
  status: string;
  events_url: string;
}

/** 视觉分析事件类型 */
export type VisionEventType = 
  | "start"         // 任务开始
  | "file_start"    // 开始处理文件
  | "pdf_convert"   // PDF 转换进度
  | "api_call"      // 调用 AI 模型
  | "file_done"     // 文件处理完成
  | "progress"      // 通用进度更新
  | "complete"      // 任务完成（包含完整结果）
  | "error"         // 任务失败
  | "cancelled";    // 任务取消

/** 视觉分析事件数据 */
export interface VisionEventData {
  message_id: string;
  type: VisionEventType;
  timestamp: number;
  data: any;
}

// ============== 重导出 Store 类型 ==============
export type { ProjectItem };
