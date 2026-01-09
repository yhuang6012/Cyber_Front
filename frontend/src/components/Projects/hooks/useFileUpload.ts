import { useRef, useCallback, useEffect } from 'react';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import {
  uploadBpFiles,
  openPdfTasksPolling,
  getProjectIntakeDraft,
  PdfTaskStatus,
  generateAiSummary,
} from '@/lib/projectApi';

export function useFileUpload() {
  const {
    addUploadTask,
    updateUploadTask,
    updateProject,
  } = useAppStore();

  // Polling connection ref for cleanup
  const pollingRef = useRef<{ close: () => void } | null>(null);

  // Track pending tasks: taskId -> { uiTaskId, fileName, fileSize, projectId, fileId, fileType }
  const pendingTasksRef = useRef<Map<string, { 
    uiTaskId: string; 
    fileName: string; 
    fileSize: number; 
    projectId: string;
    fileId: string;
    fileType: string;
  }>>(new Map());

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current?.close();
    };
  }, []);

  // Handle polling task updates
  const handlePdfTaskUpdate = useCallback(async (status: PdfTaskStatus) => {
    const taskInfo = pendingTasksRef.current.get(status.task_id);
    if (!taskInfo) return;

    const { uiTaskId, fileName, projectId } = taskInfo;
    const normalized = String(status.status || '').toLowerCase();
    const nextProgress = Math.max(
      0,
      Math.min(100, Number(status.progress ?? 0)),
    );

    if (normalized === 'pending' || normalized === 'processing') {
      // 轮询时使用后端状态 + 前端估算 progress 推进进度条
      updateUploadTask(uiTaskId, {
        status: 'parsing',
        parseProgress: Math.max(5, Math.min(95, nextProgress || 10)),
      });
      return;
    }

    if (normalized === 'completed') {
      // Parsing completed - fetch project data and create project card
      updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 80 });

      try {
        // 使用 project_id（来自 bps 上传接口返回）获取项目提取的数据
        const extractedInfo = await getProjectIntakeDraft(projectId);
        
        // 创建项目卡片（只在解析成功时创建）
        const newProject: ProjectItem = {
          id: projectId,
          name: extractedInfo.project_name || fileName.replace(/\.[^.]+$/, ''),
          description: extractedInfo.description,
          aiSummary: extractedInfo.ai_summary,
          status: 'received',
          tags: [],
          sourceFileName: fileName,
          createdAt: new Date().toISOString(),
          updatedAt: extractedInfo.updated_at,
          companyName: extractedInfo.company_name,
          companyAddress: extractedInfo.company_address,
          industry: extractedInfo.industry,
          projectContact: extractedInfo.project_contact,
          contactInfo: extractedInfo.contact_info,
          uploader: extractedInfo.uploaded_by_username,
          coreTeam: extractedInfo.core_team,
          coreProduct: extractedInfo.core_product,
          coreTechnology: extractedInfo.core_technology,
          competitionAnalysis: extractedInfo.competition_analysis,
          marketSize: extractedInfo.market_size,
          financialStatus: extractedInfo.financial_status,
          financingHistory: extractedInfo.financing_history,
          keywords: extractedInfo.keywords || [],
          projectSource: extractedInfo.project_source,
        };

        // Add project and file to store
        useAppStore.setState(state => ({
          projects: [newProject, ...state.projects],
          uploadedFiles: [
            {
              id: taskInfo.fileId,
              name: fileName,
              size: taskInfo.fileSize,
              type: taskInfo.fileType,
              createdAt: new Date().toISOString(),
            },
            ...state.uploadedFiles,
          ],
        }));

        console.log('[useFileUpload] ✅ 项目卡片创建成功:', projectId, fileName);

        // Mark task as completed
        updateUploadTask(uiTaskId, {
          status: 'completed',
          parseProgress: 100,
          completedAt: new Date().toISOString(),
          projectId,
        });

        // 自动触发 AI 摘要生成
        console.log('[useFileUpload] 🤖 自动触发 AI 摘要生成:', projectId);
        generateAiSummary(projectId).catch((err) => {
          console.warn('[useFileUpload] ⚠️ AI 摘要生成失败（不影响项目创建）:', err);
        });
      } catch (err) {
        console.error('[useFileUpload] ❌ 获取项目数据失败:', err);
        // 解析失败，不创建项目卡片，只更新任务状态
        updateUploadTask(uiTaskId, {
          status: 'error',
          error: '获取项目数据失败',
        });
      }

      // Remove from pending tasks
      pendingTasksRef.current.delete(status.task_id);

      // Close polling if no more pending tasks
      if (pendingTasksRef.current.size === 0) {
        pollingRef.current?.close();
        pollingRef.current = null;
      }
    } else if (normalized === 'failed' || normalized === 'failed_permanently' || normalized === 'error') {
      const rawErr: any = (status as any)?.error;
      const detail =
        typeof rawErr === 'string'
          ? rawErr
          : rawErr?.detail || rawErr?.message || rawErr?.error || '';
      updateUploadTask(uiTaskId, {
        status: 'error',
        error: detail || '解析失败',
      });
      pendingTasksRef.current.delete(status.task_id);
    }
  }, [updateUploadTask, updateProject]);

  // Upload files via real API and track with polling
  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Create UI tasks for each file
    const fileTaskMap = new Map<string, { uiTaskId: string; file: File }>();
    for (const file of files) {
      const uiTaskId = addUploadTask(file.name, file.size);
      fileTaskMap.set(file.name, { uiTaskId, file });
    }

    try {
      // Call the real upload API
      const results = await uploadBpFiles(files);

      // Process results and start polling tracking
      const pdfTaskIds: string[] = [];

      for (const result of results) {
        // Find matching file by name (prefer server-provided name, fallback to original order)
        const responseFileName =
          (result as any)?.oss_key?.split?.('/')?.pop?.() ||
          (result as any)?.file_name ||
          (result as any)?.filename ||
          (result as any)?.original_filename ||
          (result as any)?.error?.existing_file?.file_name ||
          '';

        const matchedEntry = responseFileName
          ? Array.from(fileTaskMap.entries()).find(([name]) => {
              if (!name) return false;
              if (responseFileName === name) return true;
              // 容忍后端返回的 key 含路径等情况
              return responseFileName.includes(name) || name.includes(responseFileName.replace(/\.[^.]+$/, ''));
            })
          : undefined;
        
        // If no match by name, use first unprocessed entry
        const [matchedFileName, taskInfo] = matchedEntry || fileTaskMap.entries().next().value || [];
        
        if (!taskInfo) continue;

        const { uiTaskId, file } = taskInfo;
        fileTaskMap.delete(matchedFileName!);

        // Update upload progress to 100%
        updateUploadTask(uiTaskId, { uploadProgress: 100 });

        // 如果后端返回该文件的错误（例如重复上传），直接展示 detail 并停止后续流程（不建卡片、不启动 SSE）
        const rawErr: any = (result as any)?.error;
        const statusStr = String((result as any)?.status ?? '').toLowerCase();
        const isFailedByStatus =
          statusStr === 'error' ||
          statusStr === 'failed' ||
          statusStr === 'fail';

        if (rawErr || isFailedByStatus) {
          const detail =
            typeof rawErr === 'string'
              ? rawErr
              : rawErr?.detail || rawErr?.message || rawErr?.error || '';

          const fallbackText =
            detail ||
            (isFailedByStatus
              ? `上传失败（status=${String((result as any)?.status)}）`
              : '上传失败');

          updateUploadTask(uiTaskId, {
            status: 'error',
            error: fallbackText,
            parseProgress: 0,
          });
          continue;
        }

        // 准备项目 ID 和文件信息，但不立即创建项目卡片
        const projectId = String(result.project_id || crypto.randomUUID());
        const fileId = String(result.file_id || crypto.randomUUID());

        // If we have a pdf_task_id, track it for polling (项目卡片将在解析完成后创建)
        if (result.pdf_task_id) {
          const pdfTaskId = String(result.pdf_task_id);
          pdfTaskIds.push(pdfTaskId);
          pendingTasksRef.current.set(pdfTaskId, {
            uiTaskId,
            fileName: file.name,
            fileSize: result.size || file.size,
            projectId,
            fileId,
            fileType: file.type,
          });

          // Transition to parsing state and store taskId for cancellation
          updateUploadTask(uiTaskId, { 
            status: 'parsing', 
            parseProgress: 0,
            taskId: pdfTaskId,
            projectId, // 存储 projectId 用于后续引用
          });
          
          console.log('[useFileUpload] 📝 文件上传成功，等待解析完成后创建项目卡片:', file.name);
        } else {
          // No pdf_task_id means upload only (no parsing needed)
          // 对于不需要解析的文件，可以立即创建项目或者标记为完成
          console.log('[useFileUpload] ⚠️  文件上传成功但无需解析:', file.name);
          updateUploadTask(uiTaskId, {
            status: 'completed',
            parseProgress: 100,
            completedAt: new Date().toISOString(),
            projectId,
          });
        }
      }

      // Start polling if we have tasks to track
      if (pdfTaskIds.length > 0) {
        // Close existing polling if any
        pollingRef.current?.close();

        pollingRef.current = openPdfTasksPolling(pdfTaskIds, {
          onTaskUpdate: handlePdfTaskUpdate,
          onError: (err) => {
            // 轮询过程中出现单次网络错误时，不要把任务直接标红（后台可能仍在解析）
            console.warn('[PDF Polling] request error:', err);
          },
        }, { intervalMs: 5000 });
      }

      // 如果后端返回结果条数不足/无法匹配，避免任务一直处于 uploading 状态
      if (fileTaskMap.size > 0) {
        for (const [, { uiTaskId }] of fileTaskMap.entries()) {
          updateUploadTask(uiTaskId, {
            status: 'error',
            error: '上传失败：未收到该文件的返回结果',
          });
        }
        fileTaskMap.clear();
      }
    } catch (error) {
      // Mark all tasks as error
      for (const [, { uiTaskId }] of fileTaskMap.entries()) {
        updateUploadTask(uiTaskId, {
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败',
        });
      }
    }
  }, [addUploadTask, updateUploadTask, handlePdfTaskUpdate]);

  return { processFiles };
}
