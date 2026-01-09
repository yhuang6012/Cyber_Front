import { useState, useEffect } from 'react';
import { LEDGER_STEPS, ProjectStatus } from './ledgerTypes';
import { getStepStatus, getStepLabel } from './ledgerUtils';
import { Steps } from 'antd';

interface LedgerStepProgressProps {
  projectStatus: ProjectStatus;
  onStepClick: (stepIndex: number) => void;
}

export function LedgerStepProgress({ projectStatus, onStepClick }: LedgerStepProgressProps) {
  // 将内部状态映射到 Ant Design Steps 的状态
  const mapStatusToAntd = (stepStatus: string): 'wait' | 'process' | 'finish' | 'error' => {
    switch (stepStatus) {
      case 'completed':
        return 'finish';
      case 'active':
        return 'process';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'wait';
    }
  };

  // 找到当前活跃的步骤索引（基于项目状态）
  const activeStepIndex = LEDGER_STEPS.findIndex((_, index) => {
    const status = getStepStatus(index, projectStatus);
    return status === 'active';
  });

  // 使用本地状态跟踪当前选中的步骤（用于底部进度条）
  const [currentStep, setCurrentStep] = useState(activeStepIndex !== -1 ? activeStepIndex : 0);

  // 当项目状态改变时，更新当前步骤
  useEffect(() => {
    if (activeStepIndex !== -1) {
      setCurrentStep(activeStepIndex);
    }
  }, [activeStepIndex]);

  const items = LEDGER_STEPS.map((step, index) => {
    const stepStatus = getStepStatus(index, projectStatus);
    const antdStatus = mapStatusToAntd(stepStatus);
    const label = getStepLabel(index, projectStatus);
    
    // 根据步骤ID和状态添加自定义类名
    let customClass = `ledger-step-${step.id}`;
    if (stepStatus === 'rejected') {
      customClass += ' ledger-step-rejected';
    } else if (stepStatus === 'pending') {
      customClass += ' ledger-step-pending';
    } else if (stepStatus === 'active') {
      customClass += ' ledger-step-active';
    } else if (stepStatus === 'completed') {
      customClass += ' ledger-step-completed';
    }
    
    return {
      title: label,
      status: antdStatus,
      className: customClass,
      disabled: stepStatus === 'pending', // 待处理状态不可点击
    };
  });

  const handleChange = (value: number) => {
    setCurrentStep(value);
    onStepClick(value);
  };

  return (
    <div className="px-8 py-3 bg-white flex-shrink-0">
      <Steps
        type="navigation"
        current={currentStep}
        onChange={handleChange}
        items={items}
        size="small"
        className="ledger-steps-navigation"
      />
    </div>
  );
}
