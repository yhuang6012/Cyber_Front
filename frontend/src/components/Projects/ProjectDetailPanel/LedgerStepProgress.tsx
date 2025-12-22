import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEDGER_STEPS, ProjectStatus } from './ledgerTypes';
import { getStepStatus, getStepLabel, getStepColor } from './ledgerUtils';

interface LedgerStepProgressProps {
  projectStatus: ProjectStatus;
  onStepClick: (stepIndex: number) => void;
}

export function LedgerStepProgress({ projectStatus, onStepClick }: LedgerStepProgressProps) {
  return (
    <div className="px-8 py-3 bg-muted/20 flex-shrink-0">
      <div className="flex items-center w-full">
        <div className="flex items-center flex-1">
          {LEDGER_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index, projectStatus);
            const isCompleted = stepStatus === 'completed' || stepStatus === 'active';
            const isRejected = stepStatus === 'rejected';

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Chevron Segment */}
                <div
                  onClick={() => onStepClick(index)}
                  className={cn(
                    "relative flex items-center justify-center py-2 cursor-pointer transition-all w-full",
                    getStepColor(index, projectStatus),
                    "hover:opacity-90",
                    // 第一个：左圆角
                    index === 0 && "rounded-l-lg",
                    // 最后一个：右圆角
                    index === LEDGER_STEPS.length - 1 && "rounded-r-lg",
                    // Chevron 形状
                    index < LEDGER_STEPS.length - 1 && "mr-[-1px]",
                    index > 0 && "ml-[-1px]"
                  )}
                  data-status-segment="true"
                  style={{
                    clipPath: index === 0
                      ? 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)'
                      : index === LEDGER_STEPS.length - 1
                        ? 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
                        : 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)'
                  }}
                >
                  <div className="flex items-center gap-1.5 z-10">
                    {isCompleted && !isRejected && (
                      <CheckCircle2 className="size-4" />
                    )}
                    <span className="font-medium text-xs whitespace-nowrap">
                      {getStepLabel(index, projectStatus)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
