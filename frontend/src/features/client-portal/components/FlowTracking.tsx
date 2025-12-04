import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientLayout } from './ClientLayout';
import { clientService } from '../services/client.service';
import type { IClientFlowInstance, IClientFlowStep } from '../services/client.types';

export const FlowTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [flow, setFlow] = useState<IClientFlowInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const instance = await clientService.getFlowInstance(id);
        setFlow(instance);
        setError(null);
      } catch (err) {
        console.error('Failed to load client flow instance', err);
        setError('Failed to load flow. Please try again.');
      }
    };

    void load();

    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const completed = useMemo(
    () => (flow ? flow.steps.filter((s) => s.status === 'COMPLETED') : []),
    [flow]
  );
  const pending = useMemo(
    () => (flow ? flow.steps.filter((s) => s.status === 'PENDING') : []),
    [flow]
  );
  const current = useMemo<IClientFlowStep | undefined>(
    () => (flow ? flow.steps.find((s) => s.status === 'CURRENT') : undefined),
    [flow]
  );

  const completedCount = completed.length;
  const totalSteps = flow?.steps.length ?? 0;

  if (!flow) {
    return (
      <ClientLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {error || 'Loading workflow...'}
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate('/client/flows')}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          ← Back to Flows
        </button>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-xl">
          <h1 className="text-lg font-semibold">{flow.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Instance {flow.instanceNumber} • Started: {flow.startedAt}
          </p>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedCount} of {totalSteps} steps completed
              </span>
            </div>
            <div className="mt-2 flex gap-1">
              {flow.steps.map((step) => (
                <span
                  key={step.id}
                  className={`h-2 flex-1 rounded-full ${
                    step.status === 'completed'
                      ? 'bg-emerald-500'
                      : step.status === 'current'
                      ? 'bg-blue-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {/* Completed step card */}
          {completed.map((step) => (
            <div
              key={step.id}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  ✅ {step.name.replace(/^Step \d+:\s?/, 'Step 1: Employee Submission')}
                </div>
                <button
                  type="button"
                  className="text-[11px] text-blue-300 hover:text-blue-200 underline-offset-2 hover:underline"
                >
                  View Details
                </button>
              </div>
              <div className="mt-1 text-muted-foreground">
                Completed by: {step.completedBy || 'Unknown'}
              </div>
              {step.completedAt && (
                <div className="text-muted-foreground">Completed: {step.completedAt}</div>
              )}
            </div>
          ))}

          {/* Current step card */}
          {current && (
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-xs">
              <div className="font-medium">⏳ {current.name}</div>
              <div className="mt-1 text-muted-foreground">
                Assigned to: {current.assignedTo || 'You'}
              </div>
              {current.due && (
                <div className="text-muted-foreground">Due: {current.due}</div>
              )}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    // In a full implementation, this would deep-link to the specific task execution
                    navigate('/client/tasks');
                  }}
                  className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-blue-400"
                >
                  Complete Task
                </button>
              </div>
            </div>
          )}

          {/* Pending steps cards */}
          {pending.map((step) => (
            <div
              key={step.id}
              className="rounded-xl border border-slate-700 bg-background p-4 text-xs"
            >
              <div className="font-medium">⚪ {step.name}</div>
              <div className="mt-1 text-muted-foreground">
                Waiting for previous step to complete.
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
};

