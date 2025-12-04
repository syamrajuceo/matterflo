import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import {
  IDataset,
  IDatasetSection,
  IDatasetWithData,
  ICreateDatasetRequest,
  IUpdateDatasetRequest,
  IAddSectionRequest,
  IUpdateSectionRequest,
  ITasksSectionConfig,
  IDataTableConfig,
  IDataChartConfig,
  IDataCardsConfig,
} from './dataset.types';
import { randomUUID } from 'crypto';
import { taskService } from '../tasks/task.service';
import { databaseService } from '../database/database.service';

class DatasetService {
  // Map Prisma model to interface
  private mapToIDataset(dataset: any): IDataset {
    return {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description || undefined,
      category: dataset.category || undefined,
      sections: (dataset.sections as unknown as IDatasetSection[]) || [],
      visibility: (dataset.visibility as unknown as { roles: string[]; users?: string[] }) || { roles: [] },
      companyId: dataset.companyId,
      status: dataset.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
    };
  }

  // Create dataset
  async createDataset(data: ICreateDatasetRequest & { companyId: string }): Promise<IDataset> {
    try {
      const dataset = await prisma.dataset.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          sections: [],
          visibility: {
            roles: data.visibility?.roles || [],
            users: data.visibility?.users || [],
          },
          companyId: data.companyId,
          status: 'DRAFT',
        },
      });

      return this.mapToIDataset(dataset);
    } catch (error) {
      console.error('Error creating dataset:', error);
      throw error;
    }
  }

  // Get dataset
  async getDataset(id: string): Promise<IDataset | null> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id },
      });

      if (!dataset) {
        return null;
      }

      return this.mapToIDataset(dataset);
    } catch (error) {
      console.error('Error getting dataset:', error);
      throw error;
    }
  }

  // List datasets
  async listDatasets(companyId: string): Promise<IDataset[]> {
    try {
      const datasets = await prisma.dataset.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });

      return datasets.map((d) => this.mapToIDataset(d));
    } catch (error) {
      console.error('Error listing datasets:', error);
      throw error;
    }
  }

  // Update dataset
  async updateDataset(id: string, updates: IUpdateDatasetRequest): Promise<IDataset> {
    try {
      const existing = await prisma.dataset.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Dataset');
      }

      const existingVisibility = (existing.visibility as unknown as { roles?: string[]; users?: string[] }) || { roles: [], users: [] };
      
      const dataset = await prisma.dataset.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.category !== undefined && { category: updates.category }),
          ...(updates.status && { status: updates.status }),
          ...(updates.visibility && {
            visibility: {
              roles: updates.visibility.roles || existingVisibility.roles || [],
              users: updates.visibility.users || existingVisibility.users || [],
            },
          }),
        },
      });

      return this.mapToIDataset(dataset);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating dataset:', error);
      throw error;
    }
  }

  // Delete dataset
  async deleteDataset(id: string): Promise<void> {
    try {
      const existing = await prisma.dataset.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Dataset');
      }

      await prisma.dataset.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting dataset:', error);
      throw error;
    }
  }

  // Add section
  async addSection(datasetId: string, section: IAddSectionRequest): Promise<IDataset> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
      });

      if (!dataset) {
        throw new NotFoundError('Dataset');
      }

      const sections = (dataset.sections as unknown as IDatasetSection[]) || [];
      const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order)) : -1;

      const newSection: IDatasetSection = {
        id: randomUUID(),
        type: section.type,
        title: section.title,
        config: section.config,
        order: maxOrder + 1,
      };

      sections.push(newSection);

      const updated = await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          sections: sections as any,
        },
      });

      return this.mapToIDataset(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error adding section:', error);
      throw error;
    }
  }

  // Update section
  async updateSection(datasetId: string, sectionId: string, updates: IUpdateSectionRequest): Promise<IDataset> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
      });

      if (!dataset) {
        throw new NotFoundError('Dataset');
      }

      const sections = (dataset.sections as unknown as IDatasetSection[]) || [];
      const sectionIndex = sections.findIndex((s) => s.id === sectionId);

      if (sectionIndex === -1) {
        throw new NotFoundError('Section');
      }

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        ...(updates.title && { title: updates.title }),
        ...(updates.config && { config: updates.config }),
      };

      const updated = await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          sections: sections as any,
        },
      });

      return this.mapToIDataset(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating section:', error);
      throw error;
    }
  }

  // Delete section
  async deleteSection(datasetId: string, sectionId: string): Promise<IDataset> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
      });

      if (!dataset) {
        throw new NotFoundError('Dataset');
      }

      const sections = (dataset.sections as unknown as IDatasetSection[]) || [];
      const filteredSections = sections.filter((s) => s.id !== sectionId);

      const updated = await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          sections: filteredSections as any,
        },
      });

      return this.mapToIDataset(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting section:', error);
      throw error;
    }
  }

  // Reorder sections
  async reorderSections(datasetId: string, sectionIds: string[]): Promise<IDataset> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
      });

      if (!dataset) {
        throw new NotFoundError('Dataset');
      }

      const sections = (dataset.sections as unknown as IDatasetSection[]) || [];
      const sectionMap = new Map(sections.map((s) => [s.id, s]));

      // Validate all section IDs exist
      for (const id of sectionIds) {
        if (!sectionMap.has(id)) {
          throw new ValidationError(`Section with id "${id}" not found`, { sectionId: id });
        }
      }

      // Reorder sections
      const reorderedSections = sectionIds.map((id, index) => ({
        ...sectionMap.get(id)!,
        order: index,
      }));

      const updated = await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          sections: reorderedSections as any,
        },
      });

      return this.mapToIDataset(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error reordering sections:', error);
      throw error;
    }
  }

  // Check visibility permissions
  private async checkVisibility(dataset: IDataset, userId: string, userRole?: string): Promise<boolean> {
    // Check if user is in allowed users list
    if (dataset.visibility.users && dataset.visibility.users.includes(userId)) {
      return true;
    }

    // Check if user's role is in allowed roles
    if (userRole && dataset.visibility.roles.includes(userRole)) {
      return true;
    }

    // If no visibility restrictions, allow access
    if (dataset.visibility.roles.length === 0 && (!dataset.visibility.users || dataset.visibility.users.length === 0)) {
      return true;
    }

    return false;
  }

  // Fetch tasks data
  private async fetchTasksData(config: ITasksSectionConfig, companyId: string): Promise<any> {
    try {
      // Get all tasks for the company
      const result = await taskService.listTasks({
        companyId,
        limit: 1000, // Get more tasks for filtering
      });

      // Filter by task IDs if specified
      let filteredTasks = result.tasks;
      if (config.taskIds && config.taskIds.length > 0) {
        filteredTasks = result.tasks.filter((t) => config.taskIds.includes(t.id));
      }

      // Apply filters
      if (config.filters) {
        if (config.filters.status) {
          filteredTasks = filteredTasks.filter((t) => t.status === config.filters!.status);
        }
        // Note: ITask doesn't have assignedTo field, so we skip this filter
        // If you need to filter by assignee, you'd need to query task executions
      }

      return {
        tasks: filteredTasks,
        layout: config.layout || 'list',
      };
    } catch (error) {
      console.error('Error fetching tasks data:', error);
      return { tasks: [], layout: config.layout || 'list' };
    }
  }

  // Fetch data table data
  private async fetchDataTableData(config: IDataTableConfig): Promise<any> {
    try {
      const options: any = {
        page: 1,
        limit: 100,
      };

      if (config.filters) {
        options.filters = config.filters;
      }

      if (config.sortBy) {
        options.sort = {
          field: config.sortBy.field,
          order: config.sortBy.order,
        };
      }

      const result = await databaseService.queryRecords(config.tableId, options);

      // Filter columns if specified
      if (config.columns && config.columns.length > 0) {
        result.records = result.records.map((record: any) => {
          const filtered: any = { id: record.id };
          for (const col of config.columns) {
            if (record[col] !== undefined) {
              filtered[col] = record[col];
            }
          }
          return filtered;
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching data table data:', error);
      return { records: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  // Fetch chart data with aggregation
  private async fetchChartData(config: IDataChartConfig): Promise<any> {
    try {
      const options: any = {
        page: 1,
        limit: 1000, // Get more data for aggregation
      };

      const result = await databaseService.queryRecords(config.dataSource.tableId, options);

      if (!result.records || result.records.length === 0) {
        return { labels: [], values: [] };
      }

      // Group by xAxis and aggregate yAxis
      const grouped: Record<string, number[]> = {};

      for (const record of result.records) {
        const xValue = String(record[config.dataSource.xAxis] || 'Unknown');
        const yValue = record[config.dataSource.yAxis];

        if (!grouped[xValue]) {
          grouped[xValue] = [];
        }

        if (yValue !== undefined && yValue !== null) {
          const numValue = typeof yValue === 'number' ? yValue : parseFloat(String(yValue));
          if (!isNaN(numValue)) {
            grouped[xValue].push(numValue);
          }
        }
      }

      // Aggregate values
      const labels: string[] = [];
      const values: number[] = [];

      for (const [label, valueArray] of Object.entries(grouped)) {
        labels.push(label);

        let aggregatedValue = 0;
        if (valueArray.length > 0) {
          switch (config.dataSource.aggregation || 'count') {
            case 'count':
              aggregatedValue = valueArray.length;
              break;
            case 'sum':
              aggregatedValue = valueArray.reduce((a, b) => a + b, 0);
              break;
            case 'avg':
              aggregatedValue = valueArray.reduce((a, b) => a + b, 0) / valueArray.length;
              break;
            case 'min':
              aggregatedValue = Math.min(...valueArray);
              break;
            case 'max':
              aggregatedValue = Math.max(...valueArray);
              break;
          }
        }

        values.push(aggregatedValue);
      }

      return {
        chartType: config.chartType,
        labels,
        values,
      };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return { chartType: config.chartType, labels: [], values: [] };
    }
  }

  // Fetch cards data
  private async fetchCardsData(config: IDataCardsConfig): Promise<any> {
    try {
      const options: any = {
        page: 1,
        limit: config.limit || 20,
      };

      const result = await databaseService.queryRecords(config.tableId, options);

      return {
        records: result.records,
        template: config.template,
        columns: config.columns || 3,
      };
    } catch (error) {
      console.error('Error fetching cards data:', error);
      return { records: [], template: config.template, columns: config.columns || 3 };
    }
  }

  // Get dataset with data
  async getDatasetWithData(id: string, userId: string, userRole?: string): Promise<IDatasetWithData> {
    try {
      const dataset = await this.getDataset(id);

      if (!dataset) {
        throw new NotFoundError('Dataset');
      }

      // Check visibility
      const hasAccess = await this.checkVisibility(dataset, userId, userRole);
      if (!hasAccess) {
        throw new ValidationError('You do not have permission to view this dataset', { datasetId: id, userId });
      }

      // Fetch data for each section
      const sectionData: Record<string, any> = {};

      for (const section of dataset.sections) {
        try {
          switch (section.type) {
            case 'tasks':
              sectionData[section.id] = await this.fetchTasksData(section.config as ITasksSectionConfig, dataset.companyId);
              break;

            case 'data-table':
              sectionData[section.id] = await this.fetchDataTableData(section.config as IDataTableConfig);
              break;

            case 'data-chart':
              sectionData[section.id] = await this.fetchChartData(section.config as IDataChartConfig);
              break;

            case 'data-cards':
              sectionData[section.id] = await this.fetchCardsData(section.config as IDataCardsConfig);
              break;

            case 'text':
              // Text sections don't need data fetching
              sectionData[section.id] = { content: section.config.content || '' };
              break;

            default:
              sectionData[section.id] = { error: 'Unknown section type' };
          }
        } catch (error) {
          console.error(`Error fetching data for section ${section.id}:`, error);
          sectionData[section.id] = { error: 'Failed to load data' };
        }
      }

      return {
        dataset,
        data: sectionData,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error getting dataset with data:', error);
      throw error;
    }
  }

  // Publish dataset
  async publishDataset(id: string): Promise<IDataset> {
    try {
      const dataset = await prisma.dataset.findUnique({
        where: { id },
      });

      if (!dataset) {
        throw new NotFoundError('Dataset');
      }

      const updated = await prisma.dataset.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
        },
      });

      return this.mapToIDataset(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error publishing dataset:', error);
      throw error;
    }
  }
}

export const datasetService = new DatasetService();

