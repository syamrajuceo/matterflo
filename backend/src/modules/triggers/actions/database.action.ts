import type { IDatabaseAction, IActionExecutionResult } from '../trigger.types';
import { prisma } from '../../../common/config/database.config';

/**
 * Execute database action - create, update, or delete records
 */
export async function updateDatabase(
  action: IDatabaseAction,
  context: Record<string, any>
): Promise<IActionExecutionResult> {
  const startTime = Date.now();

  try {
    // Verify table exists
    const table = await prisma.customTable.findUnique({
      where: { id: action.tableId },
    });

    if (!table) {
      throw new Error(`Table with ID ${action.tableId} not found`);
    }

    let result: any;

    switch (action.operation) {
      case 'create':
        if (!action.data) {
          throw new Error('Data is required for create operation');
        }
        // Merge context data
        const createData = {
          ...action.data,
          ...context,
        };
        result = await prisma.customTableRecord.create({
          data: {
            tableId: action.tableId,
            data: createData as any,
          },
        });
        break;

      case 'update':
        if (!action.where || !action.data) {
          throw new Error('Where clause and data are required for update operation');
        }
        // Find records matching where clause
        const records = await prisma.customTableRecord.findMany({
          where: {
            tableId: action.tableId,
            data: {
              path: Object.keys(action.where),
              equals: Object.values(action.where),
            },
          } as any,
        });

        if (records.length === 0) {
          throw new Error('No records found matching where clause');
        }

        // Update all matching records
        const updatePromises = records.map((record) =>
          prisma.customTableRecord.update({
            where: { id: record.id },
            data: {
              data: {
                ...(record.data as any),
                ...action.data,
                ...context,
              } as any,
            },
          })
        );

        result = await Promise.all(updatePromises);
        break;

      case 'delete':
        if (!action.where) {
          throw new Error('Where clause is required for delete operation');
        }
        // Find and delete matching records
        const recordsToDelete = await prisma.customTableRecord.findMany({
          where: {
            tableId: action.tableId,
            data: {
              path: Object.keys(action.where),
              equals: Object.values(action.where),
            },
          } as any,
        });

        if (recordsToDelete.length === 0) {
          throw new Error('No records found matching where clause');
        }

        const deletePromises = recordsToDelete.map((record) =>
          prisma.customTableRecord.delete({
            where: { id: record.id },
          })
        );

        result = await Promise.all(deletePromises);
        break;

      default:
        throw new Error(`Unknown operation: ${action.operation}`);
    }

    const executionTime = Date.now() - startTime;

    return {
      action,
      success: true,
      result: {
        operation: action.operation,
        affected: Array.isArray(result) ? result.length : 1,
        result,
      },
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      action,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
    };
  }
}

