export interface IClientTask {
  id: string;
  title: string;
  amount: string;
  due: string;
  priority: 'urgent' | 'normal';
}

export interface IClientTaskCompletionRequest {
  data: Record<string, any>;
}

export interface IClientPendingTasksResponse {
  tasks: IClientTask[];
}

export interface IClientDashboardStats {
  pendingCount: number;
  urgentCount: number;
  completedCount: number;
  activeWorkflows: Array<{
    id: string;
    name: string;
    stepsCompleted: number;
    totalSteps: number;
  }>;
}

export type ClientTaskStatus = 'PENDING' | 'COMPLETED';

export interface IClientTaskSummary extends IClientTask {
  status: ClientTaskStatus;
  completedAt?: string;
}

export interface IClientTaskExecutionField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  required?: boolean;
}

export interface IClientTaskExecution {
  id: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  submittedData: {
    employeeName: string;
    amount: string;
    category: string;
    receiptFileName: string;
    description: string;
  };
  fields: IClientTaskExecutionField[];
  status: ClientTaskStatus;
  completedAt?: string;
}

export type ClientFlowStepStatus = 'COMPLETED' | 'CURRENT' | 'PENDING';

export interface IClientFlowStep {
  id: string;
  name: string;
  status: ClientFlowStepStatus;
  completedBy?: string;
  completedAt?: string;
  assignedTo?: string;
  due?: string;
}

export interface IClientFlowInstance {
  id: string;
  name: string;
  instanceNumber: string;
  startedAt: string;
  steps: IClientFlowStep[];
}

