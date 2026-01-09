import { StepStatus, ProjectStatus, LEDGER_STEPS } from './ledgerTypes';

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 判断文件名是否为音频文件
 */
export function isAudioFileName(name: string): boolean {
  const lower = (name || '').toLowerCase();
  return ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus'].some(ext => lower.endsWith(ext));
}

/**
 * 判断文件名是否为视觉文件（图片、视频或 PDF）
 */
export function isVisualFileName(name: string): boolean {
  const lower = (name || '').toLowerCase();
  const visualExtensions = [
    // 视频
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm',
    // 图片
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg', '.heic',
    // PDF (视觉分析支持)
    '.pdf',
  ];
  return visualExtensions.some(ext => lower.endsWith(ext));
}

/**
 * 判断文件是否支持预览（PDF、Office 文档等）
 * 支持格式：
 * - 文字文档（Word）：doc、dot、wps、wpt、docx、dotx、docm、dotm、rtf
 * - 演示文档（PPT）：ppt、pptx、pptm、ppsx、ppsm、pps、potx、potm、dpt、dps
 * - 表格文档（Excel）：xls、xlt、et、xlsx、xltx、csv、xlsm、xltm
 * - PDF文件：pdf
 */
export function isPreviewableFile(name: string): boolean {
  const lower = (name || '').toLowerCase();
  const previewableExtensions = [
    // Word
    '.doc', '.dot', '.wps', '.wpt', '.docx', '.dotx', '.docm', '.dotm', '.rtf',
    // PPT
    '.ppt', '.pptx', '.pptm', '.ppsx', '.ppsm', '.pps', '.potx', '.potm', '.dpt', '.dps',
    // Excel
    '.xls', '.xlt', '.et', '.xlsx', '.xltx', '.csv', '.xlsm', '.xltm',
    // PDF
    '.pdf',
  ];
  return previewableExtensions.some(ext => lower.endsWith(ext));
}

/**
 * 根据项目状态确定每个步骤的状态
 */
export function getStepStatus(stepIndex: number, projectStatus: ProjectStatus): StepStatus {
  if (projectStatus === 'rejected') {
    // 不受理：接收完成，受理显示"不受理"（红色），立项未到达
    const statusMap: Record<number, StepStatus> = {
      0: 'completed', // 接收
      1: 'rejected',  // 不受理（特殊状态）
      2: 'pending',   // 立项
    };
    return statusMap[stepIndex] || 'pending';
  }

  // 正常流程
  switch (projectStatus) {
    case 'received':
      return stepIndex === 0 ? 'active' : 'pending';
    case 'accepted':
      return stepIndex <= 1 ? 'completed' : 'pending';
    case 'initiated':
      return 'completed';
    default:
      return 'pending';
  }
}

/**
 * 获取步骤标签
 */
export function getStepLabel(stepIndex: number, projectStatus: ProjectStatus): string {
  if (projectStatus === 'rejected' && stepIndex === 1) {
    return '不受理';
  }
  return LEDGER_STEPS[stepIndex]?.label ?? '';
}

/**
 * 获取步骤颜色样式
 */
export function getStepColor(stepIndex: number, projectStatus: ProjectStatus): string {
  const stepStatus = getStepStatus(stepIndex, projectStatus);
  const stepId = LEDGER_STEPS[stepIndex]?.id;

  // 不受理状态：红色
  if (stepStatus === 'rejected') {
    return 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  }

  // 未激活状态：灰色
  if (stepStatus === 'pending') {
    return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }

  // 激活或完成状态：根据步骤 ID 使用对应的颜色
  switch (stepId) {
    case 'received':
      // 接收：琥珀色
      return 'bg-amber-200 text-amber-700 dark:bg-amber-900/80 dark:text-amber-400';
    case 'accepted':
      // 已受理：绿色
      return 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'initiated':
      // 已立项：蓝色
      return 'bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
}
