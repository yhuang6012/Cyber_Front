/**
 * Project API - 重导出文件
 * 
 * 为保持向后兼容，此文件重新导出 projectApi 目录下的所有模块。
 * 新代码建议直接从 '@/lib/projectApi' 导入。
 * 
 * 模块结构：
 * - projectApi/types.ts     - 类型定义
 * - projectApi/utils.ts     - 工具函数
 * - projectApi/auth.ts      - 认证相关
 * - projectApi/projects.ts  - 项目 CRUD
 * - projectApi/files.ts     - 文件操作
 * - projectApi/bp.ts        - BP 上传
 * - projectApi/pdf.ts       - PDF 任务
 * - projectApi/audio.ts     - 音频转写
 */

export * from './projectApi/index';
