import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Workflow, Search } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Flow {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
}

export function FlowSidebar() {
  const { id: currentFlowId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await axios.get('/flows', {
        params: { limit: 50 },
      });
      setFlows(response.data.data.flows || []);
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    navigate('/flows/new');
  };

  const handleSelectFlow = (flowId: string) => {
    navigate(`/flows/${flowId}`);
  };

  return (
    <div className="h-full flex flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Flows</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreateNew}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Flow List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4">
            <LoadingSpinner size="sm" label="Loading..." />
          </div>
        ) : filteredFlows.length === 0 ? (
          <div className="p-4 text-center">
            <Workflow className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              {search ? 'No flows found' : 'No flows yet'}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateNew}
                className="mt-3 h-7 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Create Flow
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFlows.map((flow) => {
              const isActive = flow.id === currentFlowId;
              return (
                <button
                  key={flow.id}
                  onClick={() => handleSelectFlow(flow.id)}
                  className={`w-full text-left rounded-lg p-2.5 transition ${
                    isActive
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-sm font-medium line-clamp-1 ${
                      isActive ? 'text-primary' : 'text-foreground'
                    }`}>
                      {flow.name}
                    </span>
                    <Badge
                      variant={flow.status === 'PUBLISHED' ? 'default' : 'secondary'}
                      className="shrink-0 h-4 text-[10px] px-1.5"
                    >
                      {flow.status === 'PUBLISHED' ? 'LIVE' : 'DRAFT'}
                    </Badge>
                  </div>
                  {flow.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {flow.description}
                    </p>
                  )}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    v{flow.version}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

