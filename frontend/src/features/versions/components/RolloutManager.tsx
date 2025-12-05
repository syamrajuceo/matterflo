import { useState, useEffect } from 'react';
import { versionService } from '../services/version.service';
import type { IVersion, IRolloutStatus } from '../services/version.service';
import { companyService } from '../../company/services/company.service';
import type { ICompany } from '../../company/services/company.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Rocket, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';

interface RolloutManagerProps {
  version: IVersion;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function RolloutManager({
  version,
  isOpen,
  onClose,
  onUpdated,
}: RolloutManagerProps) {
  const [rolloutStatus, setRolloutStatus] = useState<IRolloutStatus | null>(null);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [rolloutPercentage, setRolloutPercentage] = useState(version.rolloutPercentage);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadRolloutStatus();
      loadCompanies();
    }
  }, [isOpen, version.id]);

  useEffect(() => {
    if (rolloutStatus) {
      setSelectedCompanies(rolloutStatus.deployedCompanyDetails.map(c => c.id));
      setRolloutPercentage(rolloutStatus.version.rolloutPercentage);
    }
  }, [rolloutStatus]);

  const loadRolloutStatus = async () => {
    try {
      setIsLoading(true);
      const status = await versionService.getRolloutStatus(version.id);
      setRolloutStatus(status);
    } catch (error) {
      console.error('Failed to load rollout status', error);
      showToast({
        title: 'Failed to load rollout status',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAccessibleCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies', error);
    }
  };

  const handlePercentageChange = async (percentage: number[]) => {
    const newPercentage = percentage[0];
    setRolloutPercentage(newPercentage);
    
    try {
      setIsUpdating(true);
      await versionService.updateRollout(version.id, {
        percentage: newPercentage,
      });
      await loadRolloutStatus();
      showToast({
        title: 'Rollout updated',
        description: `Rollout set to ${newPercentage}%`,
        status: 'success',
      });
      onUpdated();
    } catch (error) {
      console.error('Failed to update rollout', error);
      showToast({
        title: 'Failed to update rollout',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompanyToggle = async (companyId: string) => {
    const newSelected = selectedCompanies.includes(companyId)
      ? selectedCompanies.filter(id => id !== companyId)
      : [...selectedCompanies, companyId];

    setSelectedCompanies(newSelected);

    try {
      setIsUpdating(true);
      await versionService.updateRollout(version.id, {
        companyIds: newSelected,
      });
      await loadRolloutStatus();
      showToast({
        title: 'Rollout updated',
        description: `Updated company selection`,
        status: 'success',
      });
      onUpdated();
    } catch (error) {
      console.error('Failed to update rollout', error);
      showToast({
        title: 'Failed to update rollout',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
      // Revert selection on error
      setSelectedCompanies(selectedCompanies);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgressRollout = async () => {
    try {
      setIsUpdating(true);
      await versionService.progressRollout(version.id);
      await loadRolloutStatus();
      showToast({
        title: 'Rollout progressed',
        description: 'Rollout has been progressed to the next stage',
        status: 'success',
      });
      onUpdated();
    } catch (error) {
      console.error('Failed to progress rollout', error);
      showToast({
        title: 'Failed to progress rollout',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">Loading rollout status...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!rolloutStatus) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Manage Rollout: v{version.version}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Rollout</span>
              <Badge variant="default">
                {rolloutStatus.deployedCompanies} / {rolloutStatus.totalCompanies} companies
              </Badge>
            </div>
            <div className="w-full h-3 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${rolloutStatus.version.rolloutPercentage}%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {rolloutStatus.version.rolloutPercentage}% deployed
            </div>
          </div>

          <Separator />

          {/* Percentage Slider */}
          <div className="space-y-4">
            <div>
              <Label>Rollout Percentage</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[rolloutPercentage]}
                  onValueChange={handlePercentageChange}
                  max={100}
                  step={10}
                  className="flex-1"
                  disabled={isUpdating}
                />
                <div className="w-16 text-right font-medium">{rolloutPercentage}%</div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePercentageChange([10])}
                  disabled={isUpdating}
                >
                  10%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePercentageChange([50])}
                  disabled={isUpdating}
                >
                  50%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePercentageChange([100])}
                  disabled={isUpdating}
                >
                  100%
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleProgressRollout}
                  disabled={isUpdating || rolloutPercentage >= 100}
                  className="ml-auto gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Auto Progress
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Selection */}
          <div className="space-y-4">
            <Label>Select Companies</Label>
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-2">
                {companies.map((company) => {
                  const isSelected = selectedCompanies.includes(company.id);
                  const isDeployed = rolloutStatus.deployedCompanyDetails.some(
                    c => c.id === company.id
                  );
                  
                  return (
                    <div
                      key={company.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        id={`company-${company.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleCompanyToggle(company.id)}
                        disabled={isUpdating}
                      />
                      <Label
                        htmlFor={`company-${company.id}`}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span>{company.name}</span>
                        {isDeployed && (
                          <Badge variant="default" className="ml-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Deployed
                          </Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

