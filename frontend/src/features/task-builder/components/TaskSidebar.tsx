import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FileText, Search } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
}

export function TaskSidebar() {
  const { id: currentTaskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks', {
        params: { limit: 50 },
      });
      setTasks(response.data.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    navigate('/tasks/new');
  };

  const handleSelectTask = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tasks</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreateNew}
            className="h-6 w-6 p-0 hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5 text-slate-600" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3">
            <LoadingSpinner size="sm" label="Loading..." />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-3 text-center">
            <FileText className="mx-auto h-6 w-6 text-slate-300 mb-2" />
            <p className="text-[10px] text-slate-400">
              {search ? 'No tasks found' : 'No tasks yet'}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateNew}
                className="mt-2 h-6 text-[10px] px-2"
              >
                <Plus className="mr-1 h-3 w-3" />
                New
              </Button>
            )}
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {filteredTasks.map((task) => {
              const isActive = task.id === currentTaskId;
              return (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task.id)}
                  className={`w-full text-left rounded-md p-2 transition ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span className={`text-xs font-medium line-clamp-1 ${
                      isActive ? 'text-blue-700' : 'text-slate-700'
                    }`}>
                      {task.name}
                    </span>
                    <Badge
                      variant={task.status === 'PUBLISHED' ? 'default' : 'secondary'}
                      className="shrink-0 h-4 text-[9px] px-1"
                    >
                      {task.status === 'PUBLISHED' ? 'LIVE' : 'DRAFT'}
                    </Badge>
                  </div>
                  <div className="text-[9px] text-slate-400">
                    v{task.version}
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

