import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';
import {
  ICustomTable,
  ITableSchema,
  ITableField,
  ITableRelation,
  ICreateTableRequest,
  IUpdateTableRequest,
  IAddFieldRequest,
  IUpdateFieldRequest,
  ICreateRelationRequest,
  IQueryRecordsOptions,
  IQueryRecordsResponse,
  IImportCSVResponse,
} from './database.types';
import { randomUUID } from 'crypto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

class DatabaseService {
  // Validate snake_case name
  private validateTableName(name: string): void {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new ValidationError(
        'Table name must be in snake_case (lowercase letters, numbers, and underscores only, starting with a letter)',
        { name }
      );
    }
  }

  private validateFieldName(name: string): void {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new ValidationError(
        'Field name must be in snake_case (lowercase letters, numbers, and underscores only, starting with a letter)',
        { name }
      );
    }
  }

      // Map Prisma model to interface
  private mapTableToICustomTable(table: any): ICustomTable {
    return {
      id: table.id,
      name: table.name,
      displayName: table.displayName,
      description: table.description || undefined,
      schema: (table.schema as unknown as ITableSchema) || { fields: [] },
      relations: (table.relations as unknown as ITableRelation[]) || [],
      companyId: table.companyId,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }

  // Create custom table
  async createTable(data: ICreateTableRequest & { companyId: string }): Promise<ICustomTable> {
    try {
      // Validate name
      this.validateTableName(data.name);

      // Check if table already exists for this company
      const existing = await prisma.customTable.findUnique({
        where: {
          companyId_name: {
            companyId: data.companyId,
            name: data.name,
          },
        },
      });

      if (existing) {
        throw new ValidationError(`Table with name "${data.name}" already exists`, { name: data.name });
      }

      // Create with empty schema
      const table = await prisma.customTable.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description || null,
          schema: { fields: [] },
          relations: [],
          companyId: data.companyId,
        },
      });

      return this.mapTableToICustomTable(table);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating table:', error);
      throw error;
    }
  }

  // Add field to table
  async addField(tableId: string, field: IAddFieldRequest): Promise<ICustomTable> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // Validate field name
      this.validateFieldName(field.name);

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };

      // Check if field already exists
      if (schema.fields.some((f) => f.name === field.name)) {
        throw new ValidationError(`Field with name "${field.name}" already exists`, { fieldName: field.name });
      }

      // Create new field
      const newField: ITableField = {
        id: randomUUID(),
        name: field.name,
        displayName: field.displayName,
        type: field.type,
        required: field.required || false,
        unique: field.unique,
        defaultValue: field.defaultValue,
        validation: field.validation,
        formula: field.formula,
      };

      // Add to schema
      schema.fields.push(newField);

      // Update table
      const updated = await prisma.customTable.update({
        where: { id: tableId },
        data: {
          schema: schema as any,
        },
      });

      return this.mapTableToICustomTable(updated);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error adding field:', error);
      throw error;
    }
  }

  // Update field
  async updateField(
    tableId: string,
    fieldId: string,
    updates: IUpdateFieldRequest
  ): Promise<ICustomTable> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };
      const fieldIndex = schema.fields.findIndex((f) => f.id === fieldId);

      if (fieldIndex === -1) {
        throw new NotFoundError('Field');
      }

      // Update field
      schema.fields[fieldIndex] = {
        ...schema.fields[fieldIndex],
        ...updates,
      };

      // Update table
      const updated = await prisma.customTable.update({
        where: { id: tableId },
        data: {
          schema: schema as any,
        },
      });

      return this.mapTableToICustomTable(updated);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating field:', error);
      throw error;
    }
  }

  // Delete field
  async deleteField(tableId: string, fieldId: string): Promise<ICustomTable> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };
      const fieldIndex = schema.fields.findIndex((f) => f.id === fieldId);

      if (fieldIndex === -1) {
        throw new NotFoundError('Field');
      }

      // Remove field from schema (soft schema change - doesn't delete data)
      schema.fields.splice(fieldIndex, 1);

      // Update table
      const updated = await prisma.customTable.update({
        where: { id: tableId },
        data: {
          schema: schema as any,
        },
      });

      return this.mapTableToICustomTable(updated);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting field:', error);
      throw error;
    }
  }

  // Create relation
  async createRelation(
    tableId: string,
    relation: ICreateRelationRequest
  ): Promise<ICustomTable> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // Validate target table exists
      const targetTable = await prisma.customTable.findUnique({
        where: { id: relation.toTable },
      });

      if (!targetTable) {
        throw new NotFoundError('Target table');
      }

      // Validate fields exist in both tables
      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };
      const targetSchema = (targetTable.schema as unknown as ITableSchema) || { fields: [] };

      const fromFieldExists = schema.fields.some((f) => f.name === relation.fromField);
      const toFieldExists = targetSchema.fields.some((f) => f.name === relation.toField);

      if (!fromFieldExists) {
        throw new ValidationError(`Field "${relation.fromField}" not found in source table`, { field: relation.fromField });
      }

      if (!toFieldExists) {
        throw new ValidationError(`Field "${relation.toField}" not found in target table`, { field: relation.toField });
      }

      // Add relation
      const relations = (table.relations as unknown as ITableRelation[]) || [];
      const newRelation: ITableRelation = {
        id: randomUUID(),
        ...relation,
        fromTable: tableId,
      };

      relations.push(newRelation);

      // Update table
      const updated = await prisma.customTable.update({
        where: { id: tableId },
        data: {
          relations: relations as any,
        },
      });

      return this.mapTableToICustomTable(updated);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating relation:', error);
      throw error;
    }
  }

  // List tables
  async listTables(companyId: string): Promise<ICustomTable[]> {
    try {
      const tables = await prisma.customTable.findMany({
        where: { companyId },
        include: {
          _count: {
            select: {
              records: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return tables.map((table) => this.mapTableToICustomTable(table));
    } catch (error) {
      console.error('Error listing tables:', error);
      throw error;
    }
  }

  // Get table
  async getTable(id: string): Promise<ICustomTable | null> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id },
      });

      if (!table) {
        return null;
      }

      return this.mapTableToICustomTable(table);
    } catch (error) {
      console.error('Error getting table:', error);
      throw error;
    }
  }

  // Validate data against schema
  private validateRecordData(schema: ITableSchema, data: Record<string, any>): void {
    for (const field of schema.fields) {
      const value = data[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        throw new ValidationError(`Field "${field.displayName}" is required`, { field: field.name });
      }

      // Skip validation for undefined/null values (optional fields)
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      switch (field.type) {
        case 'number':
          if (typeof value !== 'number' && !/^\d+(\.\d+)?$/.test(String(value))) {
            throw new ValidationError(`Field "${field.displayName}" must be a number`, { field: field.name, value });
          }
          const numValue = typeof value === 'number' ? value : parseFloat(String(value));
          if (field.validation?.min !== undefined && numValue < field.validation.min) {
            throw new ValidationError(
              `Field "${field.displayName}" must be at least ${field.validation.min}`,
              { field: field.name, value, min: field.validation.min }
            );
          }
          if (field.validation?.max !== undefined && numValue > field.validation.max) {
            throw new ValidationError(
              `Field "${field.displayName}" must be at most ${field.validation.max}`,
              { field: field.name, value, max: field.validation.max }
            );
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            throw new ValidationError(`Field "${field.displayName}" must be a boolean`, { field: field.name, value });
          }
          break;

        case 'date':
          if (isNaN(Date.parse(value))) {
            throw new ValidationError(`Field "${field.displayName}" must be a valid date`, { field: field.name, value });
          }
          break;

        case 'text':
          if (typeof value !== 'string') {
            throw new ValidationError(`Field "${field.displayName}" must be a string`, { field: field.name, value });
          }
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              throw new ValidationError(
                `Field "${field.displayName}" does not match required pattern`,
                { field: field.name, value, pattern: field.validation.pattern }
              );
            }
          }
          if (field.validation?.min !== undefined && value.length < field.validation.min) {
            throw new ValidationError(
              `Field "${field.displayName}" must be at least ${field.validation.min} characters`,
              { field: field.name, value, min: field.validation.min }
            );
          }
          if (field.validation?.max !== undefined && value.length > field.validation.max) {
            throw new ValidationError(
              `Field "${field.displayName}" must be at most ${field.validation.max} characters`,
              { field: field.name, value, max: field.validation.max }
            );
          }
          break;
      }

      // Check unique constraint
      if (field.unique && value !== undefined && value !== null) {
        // This would need to be checked against existing records
        // For now, we'll skip this check during validation
        // It should be checked in insertRecord/updateRecord
      }
    }
  }

  // Evaluate computed field formula
  private evaluateComputedField(field: ITableField, recordData: Record<string, any>): any {
    if (!field.formula) {
      return null;
    }

    try {
      // Simple formula evaluation (can be enhanced)
      // For now, support basic string concatenation and arithmetic
      let formula = field.formula;

      // Replace field references with actual values
      for (const [key, value] of Object.entries(recordData)) {
        formula = formula.replace(new RegExp(key, 'g'), JSON.stringify(value));
      }

      // Evaluate (basic implementation - can be enhanced with a proper expression parser)
      // For now, just return the formula as-is for string concatenation
      if (formula.includes('+')) {
        const parts = formula.split('+').map((p) => p.trim().replace(/^"|"$/g, ''));
        return parts.join('');
      }

      return formula;
    } catch (error) {
      console.error('Error evaluating computed field:', error);
      return null;
    }
  }

  // Insert record
  async insertRecord(
    tableId: string,
    data: Record<string, any>,
    userId?: string
  ): Promise<any> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };

      // Validate data against schema
      this.validateRecordData(schema, data);

      // Process computed fields
      const processedData = { ...data };
      for (const field of schema.fields) {
        if (field.type === 'computed' && field.formula) {
          processedData[field.name] = this.evaluateComputedField(field, processedData);
        } else if (field.defaultValue !== undefined && processedData[field.name] === undefined) {
          processedData[field.name] = field.defaultValue;
        }
      }

      // Check unique constraints
      for (const field of schema.fields) {
        if (field.unique && processedData[field.name] !== undefined) {
          // Get all records and check uniqueness in memory (since JSONB queries are complex)
          const allRecords = await prisma.customTableRecord.findMany({
            where: {
              tableId,
              deletedAt: null,
            },
            select: {
              id: true,
              data: true,
            },
          });

          const duplicate = allRecords.find((record) => {
            const recordData = record.data as Record<string, any>;
            return recordData[field.name] === processedData[field.name];
          });

          if (duplicate) {
            throw new ValidationError(
              `Value "${processedData[field.name]}" for field "${field.displayName}" already exists`,
              { field: field.name, value: processedData[field.name] }
            );
          }
        }
      }

      // Insert record
      const record = await prisma.customTableRecord.create({
        data: {
          tableId,
          data: processedData as any,
          createdBy: userId || null,
          updatedBy: userId || null,
        },
      });

      return {
        id: record.id,
        ...(record.data as Record<string, any>),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error inserting record:', error);
      throw error;
    }
  }

  // Query records
  async queryRecords(
    tableId: string,
    options: IQueryRecordsOptions = {}
  ): Promise<IQueryRecordsResponse> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        tableId,
        deletedAt: null,
      };

      // Apply filters
      if (options.filters && Object.keys(options.filters).length > 0) {
        // For JSONB filtering with multiple fields, we need to use AND conditions
        const filterConditions: any[] = [];
        for (const [key, value] of Object.entries(options.filters)) {
          filterConditions.push({
            data: {
              path: [key],
              equals: value,
            },
          });
        }
        if (filterConditions.length > 0) {
          where.AND = filterConditions;
        }
      }

      // Get total count
      const total = await prisma.customTableRecord.count({ where });

      // Get records
      const records = await prisma.customTableRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: options.sort
          ? {
              // For JSONB sorting, we'd need a different approach
              // For now, sort by createdAt
              createdAt: options.sort.order === 'asc' ? 'asc' : 'desc',
            }
          : { createdAt: 'desc' },
      });

      // Map records
      const mappedRecords = records.map((record) => ({
        id: record.id,
        ...(record.data as Record<string, any>),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));

      // Apply sorting if specified (client-side for JSONB fields)
      if (options.sort && options.sort.field !== 'createdAt' && options.sort.field !== 'updatedAt') {
        mappedRecords.sort((a, b) => {
          const recordData = a as Record<string, any>;
          const recordDataB = b as Record<string, any>;
          const aVal = recordData[options.sort!.field];
          const bVal = recordDataB[options.sort!.field];
          const order = options.sort!.order === 'asc' ? 1 : -1;
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
          return 0;
        });
      }

      return {
        records: mappedRecords,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error querying records:', error);
      throw error;
    }
  }

  // Update record
  async updateRecord(
    tableId: string,
    recordId: string,
    data: Record<string, any>,
    userId?: string
  ): Promise<any> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const record = await prisma.customTableRecord.findUnique({
        where: { id: recordId },
      });

      if (!record || record.deletedAt) {
        throw new NotFoundError('Record');
      }

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };
      const existingData = (record.data as Record<string, any>) || {};

      // Merge with existing data
      const mergedData = { ...existingData, ...data };

      // Validate data against schema
      this.validateRecordData(schema, mergedData);

      // Process computed fields
      const processedData = { ...mergedData };
      for (const field of schema.fields) {
        if (field.type === 'computed' && field.formula) {
          processedData[field.name] = this.evaluateComputedField(field, processedData);
        }
      }

      // Check unique constraints (excluding current record)
      for (const field of schema.fields) {
        if (field.unique && processedData[field.name] !== undefined) {
          // Get all records and check uniqueness in memory (since JSONB queries are complex)
          const allRecords = await prisma.customTableRecord.findMany({
            where: {
              tableId,
              id: { not: recordId },
              deletedAt: null,
            },
            select: {
              id: true,
              data: true,
            },
          });

          const duplicate = allRecords.find((record) => {
            const recordData = record.data as Record<string, any>;
            return recordData[field.name] === processedData[field.name];
          });

          if (duplicate) {
            throw new ValidationError(
              `Value "${processedData[field.name]}" for field "${field.displayName}" already exists`,
              { field: field.name, value: processedData[field.name] }
            );
          }
        }
      }

      // Update record
      const updated = await prisma.customTableRecord.update({
        where: { id: recordId },
        data: {
          data: processedData as any,
          updatedBy: userId || null,
        },
      });

      return {
        id: updated.id,
        ...(updated.data as Record<string, any>),
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating record:', error);
      throw error;
    }
  }

  // Delete record (soft delete)
  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    try {
      const record = await prisma.customTableRecord.findUnique({
        where: { id: recordId },
      });

      if (!record || record.deletedAt) {
        throw new NotFoundError('Record');
      }

      if (record.tableId !== tableId) {
        throw new ValidationError('Record does not belong to this table', { recordId, tableId });
      }

      // Soft delete
      await prisma.customTableRecord.update({
        where: { id: recordId },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  // Import CSV
  async importCSV(
    tableId: string,
    file: Express.Multer.File,
    userId?: string
  ): Promise<IImportCSVResponse> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };

      // Parse CSV
      const records = parse(file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const errors: Array<{ row: number; error: string }> = [];
      let imported = 0;

      // Process each row
      for (let i = 0; i < records.length; i++) {
        try {
          const row = records[i] as Record<string, any>;
          await this.insertRecord(tableId, row, userId);
          imported++;
        } catch (error: any) {
          errors.push({
            row: i + 2, // +2 because row 1 is header, and arrays are 0-indexed
            error: error.message || 'Unknown error',
          });
        }
      }

      return { imported, errors };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error importing CSV:', error);
      throw error;
    }
  }

  // Export CSV
  async exportCSV(tableId: string): Promise<string> {
    try {
      const table = await prisma.customTable.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const schema = (table.schema as unknown as ITableSchema) || { fields: [] };

      // Get all records
      const records = await prisma.customTableRecord.findMany({
        where: {
          tableId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Map records
      const mappedRecords = records.map((record) => ({
        id: record.id,
        ...(record.data as Record<string, any>),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }));

      // Get field names for CSV header
      const fieldNames = schema.fields.map((f) => f.name);
      const headers = ['id', ...fieldNames, 'createdAt', 'updatedAt'];

      // Convert to CSV
      const csv = stringify(mappedRecords, {
        header: true,
        columns: headers,
      });

      return csv;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();

