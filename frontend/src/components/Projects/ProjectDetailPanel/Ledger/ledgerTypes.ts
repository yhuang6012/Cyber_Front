// 文件类型
export interface LedgerFile {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}

// 步骤定义
export interface LedgerStep {
  id: string;
  label: string;
}

// 步骤状态
export type StepStatus = 'pending' | 'active' | 'completed' | 'rejected';

// 项目状态
export type ProjectStatus = 'received' | 'accepted' | 'initiated' | 'rejected';

// 默认步骤配置
export const LEDGER_STEPS: LedgerStep[] = [
  { id: 'received', label: '接收' },
  { id: 'accepted', label: '受理' },
  { id: 'initiated', label: '立项' },
];
