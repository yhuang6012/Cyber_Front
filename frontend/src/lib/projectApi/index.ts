/**
 * Project API 模块
 * 
 * 按功能拆分为以下子模块：
 * - types: 类型定义
 * - utils: 工具函数
 * - auth: 认证相关
 * - projects: 项目 CRUD
 * - files: 文件操作
 * - bp: BP 上传
 * - pdf: PDF 任务
 * - audio: 音频转写
 */

// 类型导出
export * from './types';

// 工具函数导出
export { getProjectBaseUrl, normalizeStatus, mapDetailToProjectItem } from './utils';

// 认证相关
export { loginWithPassword } from './auth';

// 项目相关
export {
  getProjectIntakeDraft,
  fetchMyProjectsWithDetails,
  searchProjects,
  initiateProject,
  updateProject,
  deleteProject,
  generateAiSummary,
  matchCompany,
  confirmCompanyMatch,
  getTaskStatus,
} from './projects';

// 文件操作
export {
  getProjectFolders,
  getProjectFiles,
  deleteProjectFile,
  getProjectFileDownloadUrl,
  getProjectFilePreviewUrl,
  uploadProjectFiles,
} from './files';

// BP 上传
export { uploadBpFiles } from './bp';

// PDF 任务
export { getPdfTaskStatus, openPdfTasksPolling, cancelPdfTask } from './pdf';

// 音频转写
export { submitLongAudioTranscription, getLongAudioTranscriptionStatus } from './audio';

// 视觉转写
export { analyzeVision, getVisionEventsUrl } from './visual';
