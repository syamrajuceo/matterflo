export interface ICreateTaskExecutionRequest {
  taskId: string;
  executorId: string;
  flowInstanceId?: string;
  levelId?: string;
  initialData?: Record<string, any>;
}

export interface IUpdateTaskExecutionRequest {
  data: Record<string, any>;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface ITaskExecution {
  id: string;
  taskId: string;
  task?: {
    id: string;
    name: string;
    description?: string | null;
    fields: any;
  };
  executorId: string;
  executor?: {
    id: string;
    email: string;
    name: string;
  };
  flowInstanceId?: string | null;
  levelId?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  data: Record<string, any>;
  createdAt: string;
  completedAt?: string | null;
}

export interface ICreateFlowInstanceRequest {
  flowId: string;
  initiatorId: string;
  contextData?: Record<string, any>;
}

export interface IFlowInstance {
  id: string;
  flowId: string;
  flow?: {
    id: string;
    name: string;
    description?: string | null;
  };
  initiatorId: string;
  initiator?: {
    id: string;
    email: string;
    name: string;
  };
  currentLevelOrder: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  contextData: Record<string, any>;
  startedAt: string;
  completedAt?: string | null;
}

