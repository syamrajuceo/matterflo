import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { triggerService } from '../services/trigger.service';
import { TriggerCard } from './TriggerCard';
import { TriggerModal } from '../../trigger-builder/components/TriggerModal';
import type { ITrigger } from '../types/trigger.types';
import { useToast } from '@/components/ui/use-toast';

interface TriggerSectionProps {
  flowId: string;
  levelId: string;
  onAddTrigger?: () => void;
}

export function TriggerSection({ flowId, levelId, onAddTrigger }: TriggerSectionProps) {
  const [triggers, setTriggers] = useState<ITrigger[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<ITrigger | undefined>(undefined);
  const { showToast } = useToast();

  useEffect(() => {
    if (isExpanded && flowId && levelId) {
      loadTriggers();
    }
  }, [isExpanded, flowId, levelId]);

  const loadTriggers = async () => {
    try {
      setIsLoading(true);
      const levelTriggers = await triggerService.listTriggers({
        flowId,
        levelId,
      });
      // Ensure triggers is always an array
      setTriggers(Array.isArray(levelTriggers) ? levelTriggers : []);
    } catch (error) {
      console.error('Failed to load triggers:', error);
      setTriggers([]);
      showToast({
        title: 'Failed to load triggers',
        description: 'Please try again in a moment.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!confirm('Are you sure you want to delete this trigger?')) return;

    try {
      await triggerService.deleteTrigger(triggerId);
      setTriggers(triggers.filter((t) => t.id !== triggerId));
      showToast({
        title: 'Trigger deleted',
        description: 'The trigger has been removed from this level.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to delete trigger:', error);
      showToast({
        title: 'Failed to delete trigger',
        description: 'Please try again after reloading the flow.',
        status: 'error',
      });
    }
  };

  const handleEditTrigger = (trigger: ITrigger) => {
    setEditingTrigger(trigger);
    setIsModalOpen(true);
  };

  const handleAddNewTrigger = () => {
    setEditingTrigger(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrigger(undefined);
  };

  const handleSaveTrigger = async () => {
    // Reload triggers after save
    await loadTriggers();
    if (onAddTrigger) {
      onAddTrigger();
    }
  };

  return (
    <div className="mt-4 border-t pt-2">
      <div
        className="-mx-1 flex cursor-pointer items-center justify-between rounded px-1.5 py-1 text-xs transition hover:bg-muted"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Triggers
          </span>
          <span className="text-xs text-muted-foreground">
            ({triggers.length} trigger{triggers.length !== 1 ? 's' : ''})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2 rounded-md border border-dashed border-border bg-muted/40 px-2 py-2">
          {isLoading ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              Loading triggers...
            </div>
          ) : triggers.length === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">No triggers yet</div>
          ) : (
            (Array.isArray(triggers) ? triggers : []).map((trigger) => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                onEdit={() => handleEditTrigger(trigger)}
                onDelete={() => handleDeleteTrigger(trigger.id)}
              />
            ))
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddNewTrigger();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground transition hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
            Add Trigger
          </button>
        </div>
      )}

      {/* Trigger Modal */}
      <TriggerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        trigger={editingTrigger}
        flowId={flowId}
        levelId={levelId}
        onSave={handleSaveTrigger}
      />
    </div>
  );
}

