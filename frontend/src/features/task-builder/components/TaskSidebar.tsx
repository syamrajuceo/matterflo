import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, MoreVertical, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { taskService } from '../services/task.service';
import { useToast } from '@/components/ui/use-toast';

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
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tasks', {
        params: { limit: 50 },
      });
      const tasksData = response.data.data.tasks || [];
      console.log('[TaskSidebar] Fetched tasks:', tasksData.length, tasksData);
      setTasks(tasksData);
    } catch (error: any) {
      console.error('[TaskSidebar] Failed to fetch tasks:', error);
      console.error('[TaskSidebar] Error details:', {
        status: error?.response?.status,
        message: error?.response?.data?.error?.message,
        data: error?.response?.data,
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Listen for task updates to refresh the list
  useEffect(() => {
    const handleTaskUpdate = (event?: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[TaskSidebar] Task update event received:', customEvent?.type, customEvent?.detail);
      // Use a small delay to ensure backend has processed the change
      setTimeout(() => {
        fetchTasks();
      }, 300);
    };

    // Listen for custom events when tasks are created/updated
    window.addEventListener('task:created', handleTaskUpdate);
    window.addEventListener('task:updated', handleTaskUpdate);
    window.addEventListener('task:saved', handleTaskUpdate);
    
    // Also listen for company switch events
    window.addEventListener('companySwitched', handleTaskUpdate);

    return () => {
      window.removeEventListener('task:created', handleTaskUpdate);
      window.removeEventListener('task:updated', handleTaskUpdate);
      window.removeEventListener('task:saved', handleTaskUpdate);
      window.removeEventListener('task:deleted', handleTaskUpdate);
      window.removeEventListener('companySwitched', handleTaskUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchTasks is stable, no need to include in deps

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    navigate('/tasks/new');
  };

  const handleSelectTask = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleDeleteTask = async (taskId: string, taskName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${taskName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      
      // Remove from local state immediately
      setTasks(tasks.filter((t) => t.id !== taskId));
      
      // Dispatch event to ensure other components refresh
      window.dispatchEvent(new CustomEvent('task:deleted', { detail: { taskId } }));
      
      // If the deleted task was the current one, navigate away
      if (taskId === currentTaskId) {
        navigate('/tasks/new');
      }
      
      showToast({
        title: 'Task deleted',
        description: `"${taskName}" has been deleted.`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      const errorMessage =
        error?.response?.data?.error?.message || error?.message || 'Failed to delete task';
      showToast({
        title: 'Failed to delete task',
        description: errorMessage,
        status: 'error',
      });
    }
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
                <div
                  key={task.id}
                  className={`group w-full rounded-md p-2 transition ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <button
                    onClick={() => handleSelectTask(task.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className={`text-xs font-medium line-clamp-1 flex-1 ${
                        isActive ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {task.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={task.status === 'PUBLISHED' ? 'default' : 'secondary'}
                          className="shrink-0 h-4 text-[9px] px-1"
                        >
                          {task.status === 'PUBLISHED' ? 'LIVE' : 'DRAFT'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded transition"
                            >
                              <MoreVertical className="h-3 w-3 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTask(task.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteTask(task.id, task.name, e)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      v{task.version}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

