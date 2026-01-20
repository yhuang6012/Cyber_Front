import { useState, useEffect, useRef } from 'react';
import { ProjectItem } from '@/store/useAppStore';
import { CompanyCandidate } from '../CompanyMatchDialog';
import { 
  matchCompany, 
  confirmCompanyMatch, 
  getTaskStatus, 
  getProjectIntakeDraft, 
  mapDetailToProjectItem 
} from '@/lib/projectApi';
import { toast } from 'sonner';

interface UseCompanyMatchProps {
  project: ProjectItem;
  editedProject: ProjectItem;
  onSave: (updated: ProjectItem) => void;
}

export function useCompanyMatch({ project, editedProject, onSave }: UseCompanyMatchProps) {
  const [isMatching, setIsMatching] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [companyCandidates, setCompanyCandidates] = useState<CompanyCandidate[]>([]);
  const [isConfirmingMatch, setIsConfirmingMatch] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // 处理匹配结果
  const handleMatchResult = async (projectId: string, result: any) => {
    const status = result.status;
    const matchType = result.match_type;
    const candidates = result.candidates || [];
    const message = result.message; // 获取服务器返回的消息

    console.log(`[Poll] Company match result: status=${status}, matchType=${matchType}, message=${message}, candidates:`, candidates);

    if (status === 'completed' && matchType === 'exact') {
      // 精准匹配成功，自动关联
      console.log('[Poll] 精准匹配成功，加载完整数据');
      
      // 重新加载项目详情，包含公司信息和字段对比
      try {
        const data = await getProjectIntakeDraft(projectId, {
          includeCompany: true,
          includeComparison: true,
        }) as { project: any; company?: any; field_comparison?: any };
        
        console.log('[Poll] 加载完整项目数据（含公司信息）:', data);
        
        // 使用 editedProject 作为 fallback，确保保留所有原有的 BP 解析数据
        const updatedProject = mapDetailToProjectItem(data.project, editedProject);
        
        // 添加公司信息和字段对比
        if (data.company) {
          updatedProject.company = data.company;
        }
        if (data.field_comparison) {
          (updatedProject as any).field_comparison = data.field_comparison;
        }
        
        console.log('[Poll] 精准匹配 - 更新后的项目数据:', {
          hasCompany: !!updatedProject.company,
          hasFieldComparison: !!(updatedProject as any).field_comparison,
          hasProduct: !!updatedProject.product,
          hasCoreTeam: !!updatedProject.core_team,
        });
        
        onSave(updatedProject);
        
        // 优先使用服务器返回的 message，否则使用默认提示
        const successMessage = message || `已自动关联公司：${data.company?.company_name || result.company_name || '未知'}`;
        toast.success(`🎉 ${successMessage}`);
      } catch (error) {
        console.error('[Poll] 重新加载项目失败:', error);
        toast.error('加载公司信息失败，请重试');
      }
    } else if (status === 'need_selection' && matchType === 'fuzzy') {
      // 模糊匹配，需要用户选择
      const candidatesCount = candidates.length;
      
      if (candidatesCount === 1) {
        // 只有一个候选，直接调用详情接口获取完整数据
        console.log('[Poll] 找到 1 个候选，自动加载详细信息');
        
        try {
          const data = await getProjectIntakeDraft(projectId, {
            includeCompany: true,
            includeComparison: true,
          }) as { project: any; company?: any; field_comparison?: any };
          
          console.log('[Poll] 加载完整项目数据（含公司信息）:', data);
          
          // 使用 editedProject 作为 fallback，确保保留所有原有的 BP 解析数据
          const updatedProject = mapDetailToProjectItem(data.project, editedProject);
          
          // 添加公司信息和字段对比
          if (data.company) {
            updatedProject.company = data.company;
          }
          if (data.field_comparison) {
            (updatedProject as any).field_comparison = data.field_comparison;
          }
          
          console.log('[Poll] 单个候选 - 更新后的项目数据:', {
            hasCompany: !!updatedProject.company,
            hasFieldComparison: !!(updatedProject as any).field_comparison,
            hasProduct: !!updatedProject.product,
            hasCoreTeam: !!updatedProject.core_team,
          });
          
          onSave(updatedProject);
          
          // 优先使用服务器返回的 message，否则使用默认提示
          const successMessage = message || `已关联公司：${data.company?.company_name || candidates[0]?.company_name || '未知'}`;
          toast.success(`✅ ${successMessage}`);
        } catch (error) {
          console.error('[Poll] 重新加载项目失败:', error);
          toast.error('加载公司信息失败，请重试');
        }
      } else if (candidatesCount > 1) {
        // 多个候选，显示选择对话框（不显示 toast）
        console.log(`[Poll] 找到 ${candidatesCount} 个候选，显示选择对话框`);
        setCompanyCandidates(candidates);
        setMatchDialogOpen(true);
      } else {
        // 没有候选
        const warningMessage = message || '未找到匹配的公司';
        toast.warning(warningMessage);
      }
    } else if (status === 'not_found') {
      // 未找到匹配
      const warningMessage = message || `未找到匹配的公司：${result.company_name || editedProject.companyName || ''}`;
      toast.warning(warningMessage);
    } else if (status === 'skipped') {
      // 已有关联，跳过
      const infoMessage = message || `项目已关联公司：${result.company_name || ''}`;
      toast.info(infoMessage);
    } else if (status === 'failed') {
      // 匹配失败
      const errorMsg = message || result.error?.message || '公司匹配时发生错误';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, projectId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 最多轮询30次（90秒）

    const poll = async () => {
      attempts++;
      console.log(`[Poll] 轮询任务状态 (${attempts}/${maxAttempts}):`, taskId);

      try {
        const data = await getTaskStatus(taskId);
        console.log('[Poll] 任务状态:', data);

        if (data.status === 'SUCCESS') {
          // 任务成功完成，处理结果
          console.log('[Poll] ✅ 任务完成，处理匹配结果');
          setIsMatching(false);
          
          if (data.result) {
            // 等待处理完成后再显示对话框
            await handleMatchResult(projectId, data.result);
          } else {
            toast.error('任务完成但未返回结果');
          }
          return;
        } else if (data.status === 'FAILURE') {
          // 任务失败
          console.log('[Poll] ❌ 任务失败:', data.error);
          setIsMatching(false);
          toast.error(`匹配失败：${data.error || '未知错误'}`);
          return;
        }
        // PENDING 或 STARTED 状态，继续轮询
        console.log(`[Poll] ⏳ 任务进行中 (${data.status})，继续轮询...`);
      } catch (e: any) {
        console.error('[Poll] 轮询错误:', e);
        // 出错也继续轮询，除非达到最大次数
      }

      // 继续轮询
      if (attempts < maxAttempts) {
        pollTimerRef.current = setTimeout(poll, 3000); // 每3秒轮询一次
      } else {
        setIsMatching(false);
        toast.warning('匹配超时，请稍后刷新页面查看结果');
      }
    };

    // 首次延迟3秒后开始轮询
    pollTimerRef.current = setTimeout(poll, 3000);
  };

  // 匹配公司
  const handleMatchCompany = async () => {
    if (!editedProject.companyName) {
      toast.error('请先填写公司名称');
      return;
    }

    // 清理之前的轮询
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    try {
      setIsMatching(true);

      // 调用匹配接口
      const result = await matchCompany(project.id, editedProject.companyName);
      console.log('[Match] 匹配任务已创建:', result);
      
      toast.info('正在匹配工商信息...');

      // 开始轮询任务状态
      if (result.task_id) {
        pollTaskStatus(result.task_id, project.id);
      } else {
        setIsMatching(false);
        toast.error('未返回任务ID');
      }
    } catch (error) {
      console.error('[Match] 匹配失败:', error);
      setIsMatching(false);
      toast.error(error instanceof Error ? error.message : '匹配失败');
      
      // 清理定时器
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  };

  // 确认公司关联
  const handleConfirmCompanyMatch = async (companyName: string) => {
    try {
      setIsConfirmingMatch(true);
      console.log('[Match] 开始确认公司关联 - projectId:', project.id, 'companyName:', companyName, 'type:', typeof companyName);
      
      const result = await confirmCompanyMatch(project.id, companyName);
      console.log('[Match] 公司关联成功:', result);
      
      if (result.confirmed) {
        toast.success(`已成功关联公司: ${companyName}`);
        
        // 重新加载项目详情，包含公司信息和字段对比
        try {
          const data = await getProjectIntakeDraft(project.id, {
            includeCompany: true,
            includeComparison: true,
          }) as { project: any; company?: any; field_comparison?: any };
          
          console.log('[Match] 加载完整项目数据（含公司信息）:', data);
          
          // 使用 editedProject 作为 fallback，确保保留所有原有的 BP 解析数据
          const updatedProject = mapDetailToProjectItem(data.project, editedProject);
          
          // 添加公司信息和字段对比
          if (data.company) {
            updatedProject.company = data.company;
          }
          if (data.field_comparison) {
            (updatedProject as any).field_comparison = data.field_comparison;
          }
          
          console.log('[Match] 更新后的项目数据:', {
            hasCompany: !!updatedProject.company,
            hasFieldComparison: !!(updatedProject as any).field_comparison,
            hasProduct: !!updatedProject.product,
            hasCoreTeam: !!updatedProject.core_team,
            hasTechnology: !!updatedProject.technology,
          });
          
          onSave(updatedProject);
        } catch (error) {
          console.error('[Match] 重新加载项目失败:', error);
          toast.error('加载公司信息失败');
        }
      } else {
        toast.error(result.message || '关联失败');
      }
      
      setMatchDialogOpen(false);
      setCompanyCandidates([]);
    } catch (error) {
      console.error('[Match] 确认关联失败:', error);
      toast.error(error instanceof Error ? error.message : '关联失败');
    } finally {
      setIsConfirmingMatch(false);
    }
  };

  return {
    // 状态
    isMatching,
    matchDialogOpen,
    companyCandidates,
    isConfirmingMatch,
    
    // 方法
    handleMatchCompany,
    handleConfirmCompanyMatch,
    setMatchDialogOpen,
    setCompanyCandidates,
  };
}
