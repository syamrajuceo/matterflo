import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clientService } from '../services/client.service';
import { ClientLayout } from './ClientLayout';
import { useClientStore } from '../store/clientStore';

import type { IClientTaskExecution, IClientTaskExecutionField } from '../services/client.types';

export const TaskCompletion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadPendingTasks } = useClientStore();

  const [task, setTask] = useState<IClientTaskExecution | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load task execution details from backend
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const execution = await clientService.getTask(id);
        setTask(execution);
        setValues({});
      } catch (err) {
        console.error('Failed to load client task execution', err);
        setError('Failed to load task. Please try again.');
      }
    };
    void load();
  }, [id]);

  const handleChange = (field: IClientTaskExecutionField, value: any) => {
    setValues((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setError(null);

    // simple client-side validation
    for (const field of task.fields) {
      if (field.required && !values[field.name]) {
        setError(`Please fill out ${field.label}.`);
        return;
      }
    }

    try {
      setSubmitting(true);

      if (!id) {
        throw new Error('Missing task id');
      }

      // Persist completion to backend
      await clientService.submitTask(id, values);

      setSuccess(true);
      setTimeout(() => {
        // Refresh pending tasks so the dashboard / My Tasks reflect the change
        void loadPendingTasks();
        navigate('/client/tasks');
      }, 1000);
    } catch (err) {
      setError('Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) {
    return (
      <ClientLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading task...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate('/client/tasks')}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          ← Back to Tasks
        </button>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 shadow-xl">
        <h1 className="text-lg font-semibold">{task.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Submitted by: {task.submittedBy} • {task.submittedAt}
        </p>

        {/* Submitted data (read-only) */}
        <div className="mt-4 space-y-2 rounded-xl border bg-background/40 p-4 text-xs">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="font-medium text-slate-200">Employee Name</div>
              <div className="text-muted-foreground">{task.submittedData.employeeName}</div>
            </div>
            <div>
              <div className="font-medium text-slate-200">Amount</div>
              <div className="text-muted-foreground">{task.submittedData.amount}</div>
            </div>
            <div>
              <div className="font-medium text-slate-200">Category</div>
              <div className="text-muted-foreground">{task.submittedData.category}</div>
            </div>
            <div>
              <div className="font-medium text-slate-200">Receipt</div>
              <div className="text-muted-foreground">
                📎 {task.submittedData.receiptFileName}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-medium text-slate-200">Description</div>
            <p className="mt-1 text-muted-foreground text-[11px]">
              {task.submittedData.description}
            </p>
          </div>
        </div>

        {/* Your response */}
        {task.description && (
          <p className="mt-6 text-xs font-medium text-muted-foreground">Your Response</p>
        )}

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {task.fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-400">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-primary"
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-primary"
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )}
            </div>
          ))}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && (
            <p className="text-xs text-emerald-400">
              Task submitted successfully. Redirecting…
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/client/tasks')}
              className="rounded-lg border border-slate-700 bg-transparent px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Response'}
            </button>
          </div>
        </form>
      </div>
    </ClientLayout>
  );
};


