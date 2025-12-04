export interface IDataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sections: IDatasetSection[];
  visibility: {
    roles: string[]; // Which roles can view
    users?: string[]; // Specific users
  };
  companyId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IDatasetSection {
  id: string;
  type: 'tasks' | 'data-table' | 'data-chart' | 'data-cards' | 'text';
  title: string;
  config: any; // Type-specific configuration
  order: number;
}

// Section configs:
export interface ITasksSectionConfig {
  taskIds: string[]; // Which tasks to display
  layout: 'list' | 'grid' | 'calendar';
  filters?: {
    status?: string;
    assignedTo?: string;
  };
}

export interface IDataTableConfig {
  tableId: string; // Custom table ID
  columns: string[]; // Field IDs to show
  filters?: Record<string, any>;
  sortBy?: { field: string; order: 'asc' | 'desc' };
}

export interface IDataChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  dataSource: {
    tableId: string;
    xAxis: string; // Field for X axis
    yAxis: string; // Field for Y axis
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
}

export interface IDataCardsConfig {
  tableId: string;
  template: string; // Handlebars template
  columns: number; // Cards per row
  limit?: number;
}

export interface ITextSectionConfig {
  content: string; // Markdown or HTML
}

// Request types
export interface ICreateDatasetRequest {
  name: string;
  description?: string;
  category?: string;
  visibility?: {
    roles?: string[];
    users?: string[];
  };
}

export interface IUpdateDatasetRequest {
  name?: string;
  description?: string;
  category?: string;
  visibility?: {
    roles?: string[];
    users?: string[];
  };
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface IAddSectionRequest {
  type: 'tasks' | 'data-table' | 'data-chart' | 'data-cards' | 'text';
  title: string;
  config: any;
}

export interface IUpdateSectionRequest {
  title?: string;
  config?: any;
}

export interface IDatasetWithData {
  dataset: IDataset;
  data: Record<string, any>; // Section ID -> section data
}

