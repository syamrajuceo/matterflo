import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading tasks..." className="py-12" />;
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FileText}
          title="No tasks yet"
          description="Create your first task to get started building forms and workflows."
          actionLabel="Create Task"
          onAction={() => window.location.href = '/tasks/new'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your custom forms and data collection tasks
          </p>
        </div>
        <Button asChild size="default">
          <Link to="/tasks/new">
            <Plus className="size-4" />
            New Task
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.id} className="group hover:shadow-lg hover:border-border transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{task.name}</CardTitle>
                  <CardDescription>
                    {task.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge variant={task.status === 'PUBLISHED' ? 'default' : 'secondary'} className="shrink-0">
                  {task.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Created {new Date(task.createdAt).toLocaleDateString()}
                </span>
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link to={`/tasks/${task.id}`}>
                    <Edit className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
