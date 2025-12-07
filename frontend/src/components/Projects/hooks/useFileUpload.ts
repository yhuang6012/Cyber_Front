import { useRef, useCallback, useEffect } from 'react';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import {
  uploadBpFiles,
  openPdfTasksSse,
  getProjectIntakeDraft,
  PdfTaskStatus,
} from '@/lib/projectApi';

export function useFileUpload() {
  const {
    addUploadTask,
    updateUploadTask,
    updateProject,
  } = useAppStore();

  // SSE connection ref for cleanup
  const sseConnectionRef = useRef<{ close: () => void } | null>(null);

  // Track pending tasks: taskId -> { uiTaskId, fileName, fileSize, projectId }
  const pendingTasksRef = useRef<Map<string, { uiTaskId: string; fileName: string; fileSize: number; projectId: string }>>(new Map());

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      sseConnectionRef.current?.close();
    };
  }, []);

  // Handle SSE task updates
  const handleSseTaskUpdate = useCallback(async (status: PdfTaskStatus) => {
    const taskInfo = pendingTasksRef.current.get(status.task_id);
    if (!taskInfo) return;

    const { uiTaskId, fileName, projectId } = taskInfo;

    if (status.status === 'processing') {
      // Still parsing - update progress (estimate based on time or just show indeterminate)
      updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 50 });
    } else if (status.status === 'completed') {
      // Parsing completed - fetch project data via GET /api/projects/{project_id}
      updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 80 });

      try {
        // 使用 project_id（来自 bps 上传接口返回）获取项目提取的数据
        const extractedInfo = await getProjectIntakeDraft(projectId);
        
        // Map extracted info to ProjectItem fields (根据实际返回数据结构)
        const projectUpdates: Partial<ProjectItem> = {
          name: extractedInfo.project_name || fileName.replace(/\.[^.]+$/, ''),
          description: extractedInfo.description,
          companyName: extractedInfo.company_name,
          companyAddress: extractedInfo.company_address,
          industry: extractedInfo.industry,
          projectContact: extractedInfo.project_contact,
          contactInfo: extractedInfo.contact_info,
          uploader: extractedInfo.uploaded_by_username,
          coreTeam: extractedInfo.core_team, // 数组类型
          coreProduct: extractedInfo.core_product,
          coreTechnology: extractedInfo.core_technology,
          competitionAnalysis: extractedInfo.competition_analysis,
          marketSize: extractedInfo.market_size,
          financialStatus: extractedInfo.financial_status, // { current, future }
          financingHistory: extractedInfo.financing_history, // { completed_rounds, current_funding_need, funding_use }
          keywords: extractedInfo.keywords || [],
          updatedAt: extractedInfo.updated_at,
          projectSource: extractedInfo.project_source,
        };

        // Update the project with extracted info
        updateProject(projectId, projectUpdates);

        // Mark task as completed
        updateUploadTask(uiTaskId, {
          status: 'completed',
          parseProgress: 100,
          completedAt: new Date().toISOString(),
          projectId,
        });
      } catch (err) {
        console.error('[SSE] Failed to fetch project data:', err);
        updateUploadTask(uiTaskId, {
          status: 'completed',
          parseProgress: 100,
          completedAt: new Date().toISOString(),
          projectId,
        });
      }

      // Remove from pending tasks
      pendingTasksRef.current.delete(status.task_id);

      // Close SSE if no more pending tasks
      if (pendingTasksRef.current.size === 0) {
        sseConnectionRef.current?.close();
        sseConnectionRef.current = null;
      }
    } else if (status.status === 'failed' || status.status === 'error') {
      updateUploadTask(uiTaskId, {
        status: 'error',
        error: '解析失败',
      });
      pendingTasksRef.current.delete(status.task_id);
    }
  }, [updateUploadTask, updateProject]);

  // Upload files via real API and track with SSE
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

      // Process results and start SSE tracking
      const pdfTaskIds: string[] = [];

      for (const result of results) {
        // Find matching file by name (from oss_key or original order)
        const fileName = result.oss_key?.split('/').pop() || '';
        const matchedEntry = Array.from(fileTaskMap.entries()).find(
          ([name]) => fileName.includes(name) || name.includes(fileName.replace(/\.[^.]+$/, ''))
        );
        
        // If no match by name, use first unprocessed entry
        const [matchedFileName, taskInfo] = matchedEntry || fileTaskMap.entries().next().value || [];
        
        if (!taskInfo) continue;

        const { uiTaskId, file } = taskInfo;
        fileTaskMap.delete(matchedFileName!);

        // Update upload progress to 100%
        updateUploadTask(uiTaskId, { uploadProgress: 100 });

        // Create a pending project
        const projectId = String(result.project_id || crypto.randomUUID());
        const newProject: ProjectItem = {
          id: projectId,
          name: file.name.replace(/\.[^.]+$/, ''),
          description: undefined,
          status: 'received',
          tags: [],
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
        };

        // Add to store
        useAppStore.setState(state => ({
          projects: [newProject, ...state.projects],
          uploadedFiles: [
            {
              id: String(result.file_id || crypto.randomUUID()),
              name: file.name,
              size: result.size || file.size,
              type: file.type,
              createdAt: new Date().toISOString(),
            },
            ...state.uploadedFiles,
          ],
        }));

        // If we have a pdf_task_id, track it for SSE
        if (result.pdf_task_id) {
          const pdfTaskId = String(result.pdf_task_id);
          pdfTaskIds.push(pdfTaskId);
          pendingTasksRef.current.set(pdfTaskId, {
            uiTaskId,
            fileName: file.name,
            fileSize: result.size || file.size,
            projectId,
          });

          // Transition to parsing state
          updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 0 });
        } else {
          // No pdf_task_id means upload only, mark as completed
          updateUploadTask(uiTaskId, {
            status: 'completed',
            parseProgress: 100,
            completedAt: new Date().toISOString(),
            projectId,
          });
        }
      }

      // Start SSE connection if we have tasks to track
      if (pdfTaskIds.length > 0) {
        // Close existing connection if any
        sseConnectionRef.current?.close();

        sseConnectionRef.current = openPdfTasksSse(pdfTaskIds, {
          onTaskUpdate: handleSseTaskUpdate,
          onError: (err) => {
            console.error('[SSE] Connection error:', err);
            // Mark all pending tasks as error
            for (const [, info] of pendingTasksRef.current.entries()) {
              updateUploadTask(info.uiTaskId, {
                status: 'error',
                error: 'SSE 连接失败',
              });
            }
            pendingTasksRef.current.clear();
          },
        });
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
  }, [addUploadTask, updateUploadTask, handleSseTaskUpdate]);

  return { processFiles };
}
