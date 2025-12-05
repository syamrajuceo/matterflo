import { prisma } from '../../common/config/database.config';
import { NotFoundError } from '../../common/errors';

export interface IExportPackage {
  company: {
    id: string;
    name: string;
    domain: string | null;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
  tasks: any[];
  flows: any[];
  datasets: any[];
  tables: any[];
  integrations: any[];
  config: {
    version: string;
    exportedAt: string;
    includesDeveloperPanel: boolean;
  };
}

class ExportService {
  /**
   * Generate export package for a company
   * This creates a standalone ERP build
   */
  async generateExport(companyId: string): Promise<IExportPackage> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          tasks: {
            where: { status: 'PUBLISHED' },
          },
          flows: {
            where: { status: 'PUBLISHED' },
            include: {
              levels: {
                include: {
                  tasks: true,
                  roles: true,
                },
              },
              branches: true,
            },
          },
          datasets: {
            where: { status: 'PUBLISHED' },
          },
          tables: true,
          integrations: {
            where: { isActive: true },
            include: {
              workflows: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundError('Company');
      }

      return {
        company: {
          id: company.id,
          name: company.name,
          domain: company.domain,
          logo: company.logo,
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
        },
        tasks: company.tasks,
        flows: company.flows,
        datasets: company.datasets,
        tables: company.tables,
        integrations: company.integrations,
        config: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          includesDeveloperPanel: true,
        },
      };
    } catch (error) {
      console.error('Error generating export:', error);
      throw error;
    }
  }

  /**
   * Generate export as JSON string (for download)
   */
  async generateExportJSON(companyId: string): Promise<string> {
    const exportPackage = await this.generateExport(companyId);
    return JSON.stringify(exportPackage, null, 2);
  }
}

export const exportService = new ExportService();

