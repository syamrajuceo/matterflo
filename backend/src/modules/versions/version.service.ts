import { prisma } from '../../common/config/database.config';
import { NotFoundError, ValidationError } from '../../common/errors';

export interface IVersion {
  id: string;
  version: string;
  entityType: string;
  entityId: string;
  snapshot: any;
  changes?: string;
  changeLog: any[];
  status: 'DRAFT' | 'PUBLISHED' | 'STABLE' | 'DEPRECATED';
  rolloutPercentage: number;
  deployedToClients: string[];
  createdBy: string;
  createdAt: Date;
  publishedAt?: Date;
}

class VersionService {
  /**
   * Create a version snapshot of an entity
   */
  async createVersion(
    entityType: 'Task' | 'Flow' | 'Dataset' | 'CustomTable',
    entityId: string,
    createdBy: string,
    changes?: string
  ): Promise<IVersion> {
    try {
      // Get current entity state
      let entity: any;
      
      switch (entityType) {
        case 'Task':
          entity = await prisma.task.findUnique({ where: { id: entityId } });
          break;
        case 'Flow':
          entity = await prisma.flow.findUnique({ 
            where: { id: entityId },
            include: { levels: true, branches: true }
          });
          break;
        case 'Dataset':
          entity = await prisma.dataset.findUnique({ where: { id: entityId } });
          break;
        case 'CustomTable':
          entity = await prisma.customTable.findUnique({ where: { id: entityId } });
          break;
        default:
          throw new ValidationError(`Unsupported entity type: ${entityType}`, { entityType });
      }

      if (!entity) {
        throw new NotFoundError(entityType);
      }

      // Get latest version number
      const latestVersion = await prisma.version.findFirst({
        where: {
          entityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Increment version
      const versionNumber = latestVersion
        ? this.incrementVersion(latestVersion.version)
        : '1.0.0';

      // Create version snapshot
      const version = await prisma.version.create({
        data: {
          version: versionNumber,
          entityType,
          entityId,
          snapshot: entity as any,
          changes: changes || 'No changes specified',
          changeLog: [],
          status: 'DRAFT',
          rolloutPercentage: 0,
          deployedToClients: [],
          createdBy,
        },
      });

      return version as IVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Publish a version
   */
  async publishVersion(versionId: string): Promise<IVersion> {
    try {
      const version = await prisma.version.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        throw new NotFoundError('Version');
      }

      const updated = await prisma.version.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      return updated as IVersion;
    } catch (error) {
      console.error('Error publishing version:', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackVersion(versionId: string, createdBy: string): Promise<any> {
    try {
      const version = await prisma.version.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        throw new NotFoundError('Version');
      }

      const snapshot = version.snapshot as any;

      // Restore entity to snapshot state
      switch (version.entityType) {
        case 'Task':
          await prisma.task.update({
            where: { id: version.entityId },
            data: {
              name: snapshot.name,
              description: snapshot.description,
              fields: snapshot.fields,
              validations: snapshot.validations,
              logic: snapshot.logic,
              version: version.version,
            },
          });
          break;

        case 'Flow':
          // Delete existing levels and branches
          await prisma.flowLevel.deleteMany({ where: { flowId: version.entityId } });
          await prisma.flowBranch.deleteMany({ where: { flowId: version.entityId } });

          // Restore flow
          await prisma.flow.update({
            where: { id: version.entityId },
            data: {
              name: snapshot.name,
              description: snapshot.description,
              config: snapshot.config,
              version: version.version,
            },
          });

          // Restore levels
          if (snapshot.levels) {
            for (const level of snapshot.levels) {
              await prisma.flowLevel.create({
                data: {
                  flowId: version.entityId,
                  name: level.name,
                  description: level.description,
                  order: level.order,
                  config: level.config,
                },
              });
            }
          }
          break;

        case 'Dataset':
          await prisma.dataset.update({
            where: { id: version.entityId },
            data: {
              name: snapshot.name,
              description: snapshot.description,
              sections: snapshot.sections,
              visibility: snapshot.visibility,
            },
          });
          break;

        case 'CustomTable':
          await prisma.customTable.update({
            where: { id: version.entityId },
            data: {
              name: snapshot.name,
              displayName: snapshot.displayName,
              description: snapshot.description,
              schema: snapshot.schema,
              relations: snapshot.relations,
              settings: snapshot.settings,
            },
          });
          break;
      }

      // Create a new version documenting the rollback
      await this.createVersion(
        version.entityType as any,
        version.entityId,
        createdBy,
        `Rollback to version ${version.version}`
      );

      return { success: true, message: `Rolled back to version ${version.version}` };
    } catch (error) {
      console.error('Error rolling back version:', error);
      throw error;
    }
  }

  /**
   * Get version history for an entity
   */
  async getVersionHistory(
    entityType: string,
    entityId: string
  ): Promise<IVersion[]> {
    try {
      const versions = await prisma.version.findMany({
        where: {
          entityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return versions as IVersion[];
    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }

  /**
   * Increment version number (semantic versioning)
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0]) || 0;
    const minor = parseInt(parts[1]) || 0;
    const patch = parseInt(parts[2]) || 0;

    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Get all active companies for staged rollout
   */
  private async getAllActiveCompanies(): Promise<string[]> {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return companies.map(c => c.id);
  }

  /**
   * Calculate companies for a rollout percentage
   */
  private calculateRolloutCompanies(
    allCompanies: string[],
    percentage: number,
    alreadyDeployed: string[]
  ): string[] {
    const availableCompanies = allCompanies.filter(id => !alreadyDeployed.includes(id));
    const targetCount = Math.ceil((allCompanies.length * percentage) / 100);
    const neededCount = Math.max(0, targetCount - alreadyDeployed.length);
    
    // Return random selection of available companies
    const shuffled = [...availableCompanies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, neededCount);
  }

  /**
   * Update staged rollout for a version
   */
  async updateRollout(
    versionId: string,
    options: {
      percentage?: number;
      companyIds?: string[];
      autoProgress?: boolean;
    }
  ): Promise<IVersion> {
    try {
      const version = await prisma.version.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        throw new NotFoundError('Version');
      }

      if (version.status !== 'PUBLISHED') {
        throw new ValidationError('Only published versions can be rolled out', { status: version.status });
      }

      const allCompanies = await this.getAllActiveCompanies();
      const currentDeployed = (version.deployedToClients as string[]) || [];
      
      let newDeployed: string[] = [...currentDeployed];
      let newPercentage = version.rolloutPercentage;

      // If specific companies provided, add them
      if (options.companyIds && options.companyIds.length > 0) {
        const validCompanyIds = options.companyIds.filter(id => 
          allCompanies.includes(id) && !newDeployed.includes(id)
        );
        newDeployed = [...newDeployed, ...validCompanyIds];
        newPercentage = Math.round((newDeployed.length / allCompanies.length) * 100);
      }
      // If percentage provided, calculate companies
      else if (options.percentage !== undefined) {
        const targetPercentage = Math.min(100, Math.max(0, options.percentage));
        const targetCompanies = this.calculateRolloutCompanies(
          allCompanies,
          targetPercentage,
          currentDeployed
        );
        newDeployed = [...currentDeployed, ...targetCompanies];
        newPercentage = targetPercentage;
      }

      // Auto-progress: if enabled and not at 100%, check if we should progress
      if (options.autoProgress && newPercentage < 100) {
        // In a real system, you'd check monitoring/metrics here
        // For now, we'll just update the percentage
      }

      const updated = await prisma.version.update({
        where: { id: versionId },
        data: {
          rolloutPercentage: newPercentage,
          deployedToClients: newDeployed,
        },
      });

      return updated as IVersion;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error updating rollout:', error);
      throw error;
    }
  }

  /**
   * Get rollout status for a version
   */
  async getRolloutStatus(versionId: string): Promise<{
    version: IVersion;
    totalCompanies: number;
    deployedCompanies: number;
    pendingCompanies: string[];
    deployedCompanyDetails: Array<{ id: string; name: string }>;
  }> {
    try {
      const version = await prisma.version.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        throw new NotFoundError('Version');
      }

      const allCompanies = await prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      const deployedIds = (version.deployedToClients as string[]) || [];
      const deployedCompanies = allCompanies.filter(c => deployedIds.includes(c.id));
      const pendingCompanies = allCompanies
        .filter(c => !deployedIds.includes(c.id))
        .map(c => c.id);

      return {
        version: version as IVersion,
        totalCompanies: allCompanies.length,
        deployedCompanies: deployedCompanies.length,
        pendingCompanies,
        deployedCompanyDetails: deployedCompanies.map(c => ({
          id: c.id,
          name: c.name,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting rollout status:', error);
      throw error;
    }
  }

  /**
   * Progress rollout automatically (10% → 50% → 100%)
   */
  async progressRollout(versionId: string): Promise<IVersion> {
    try {
      const version = await prisma.version.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        throw new NotFoundError('Version');
      }

      const currentPercentage = version.rolloutPercentage;
      let targetPercentage: number;

      // Progressive rollout: 10% → 50% → 100%
      if (currentPercentage < 10) {
        targetPercentage = 10;
      } else if (currentPercentage < 50) {
        targetPercentage = 50;
      } else if (currentPercentage < 100) {
        targetPercentage = 100;
      } else {
        // Already at 100%
        return version as IVersion;
      }

      return await this.updateRollout(versionId, {
        percentage: targetPercentage,
        autoProgress: true,
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error progressing rollout:', error);
      throw error;
    }
  }
}

export const versionService = new VersionService();

