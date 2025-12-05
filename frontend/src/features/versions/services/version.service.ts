import axios from 'axios';

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
  createdAt: string;
  publishedAt?: string;
}

export interface IRolloutStatus {
  version: IVersion;
  totalCompanies: number;
  deployedCompanies: number;
  pendingCompanies: string[];
  deployedCompanyDetails: Array<{ id: string; name: string }>;
}

class VersionService {
  /**
   * Create a version snapshot
   */
  async createVersion(data: {
    entityType: string;
    entityId: string;
    changes?: string;
  }): Promise<IVersion> {
    const response = await axios.post<{ success: boolean; data: IVersion }>(
      '/versions',
      data
    );
    return response.data.data;
  }

  /**
   * Get version history for an entity
   */
  async getVersionHistory(
    entityType: string,
    entityId: string
  ): Promise<IVersion[]> {
    const response = await axios.get<{ success: boolean; data: IVersion[] }>(
      `/versions/${entityType}/${entityId}`
    );
    return response.data.data;
  }

  /**
   * Publish a version
   */
  async publishVersion(versionId: string): Promise<IVersion> {
    const response = await axios.post<{ success: boolean; data: IVersion }>(
      `/versions/${versionId}/publish`
    );
    return response.data.data;
  }

  /**
   * Rollback to a version
   */
  async rollbackVersion(versionId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.post<{ success: boolean; data: { success: boolean; message: string } }>(
      `/versions/${versionId}/rollback`
    );
    return response.data.data;
  }

  /**
   * Update staged rollout
   */
  async updateRollout(
    versionId: string,
    options: {
      percentage?: number;
      companyIds?: string[];
      autoProgress?: boolean;
    }
  ): Promise<IVersion> {
    const response = await axios.put<{ success: boolean; data: IVersion }>(
      `/versions/${versionId}/rollout`,
      options
    );
    return response.data.data;
  }

  /**
   * Get rollout status
   */
  async getRolloutStatus(versionId: string): Promise<IRolloutStatus> {
    const response = await axios.get<{ success: boolean; data: IRolloutStatus }>(
      `/versions/${versionId}/rollout`
    );
    return response.data.data;
  }

  /**
   * Progress rollout automatically
   */
  async progressRollout(versionId: string): Promise<IVersion> {
    const response = await axios.post<{ success: boolean; data: IVersion }>(
      `/versions/${versionId}/rollout/progress`
    );
    return response.data.data;
  }
}

export const versionService = new VersionService();


