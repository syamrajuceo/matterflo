import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { companyService } from '../../features/company/services/company.service';
import type { ICompany } from '../../features/company/services/company.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Building2 } from 'lucide-react';
import { useRole } from '../../hooks/useRole';

export function CompanySwitcher() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDeveloper } = useRole();
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDeveloper) {
      loadCompanies();
    } else {
      setIsLoading(false);
    }
  }, [isDeveloper]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await companyService.getAccessibleCompanies();
      setCompanies(data);
      
      // Set current company from localStorage or user's company
      const savedCompanyId = localStorage.getItem('activeCompanyId');
      setCurrentCompanyId(savedCompanyId || user?.companyId || null);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async (companyId: string) => {
    try {
      await companyService.switchCompanyContext(companyId);
      localStorage.setItem('activeCompanyId', companyId);
      setCurrentCompanyId(companyId);
      
      // Navigate to current route to refresh data without full page reload
      // This preserves authentication state
      navigate(location.pathname, { replace: true });
      
      // Trigger a soft refresh by dispatching a custom event
      // Components can listen to this to refresh their data
      window.dispatchEvent(new CustomEvent('companySwitched', { detail: { companyId } }));
    } catch (error) {
      console.error('Failed to switch company:', error);
    }
  };

  // Only show for developers with multiple companies
  if (!isDeveloper || companies.length <= 1) {
    return null;
  }

  if (isLoading) {
    return <div className="h-8 w-32 animate-pulse bg-muted rounded" />;
  }

  const currentCompany = companies.find(c => c.id === currentCompanyId) || companies[0];

  return (
    <Select value={currentCompanyId || ''} onValueChange={handleSwitch}>
      <SelectTrigger className="w-[180px] h-8">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select company">
          {currentCompany?.name || 'Select company'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

