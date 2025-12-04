import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { DepartmentTreeNode } from '../services/company.service';

interface DepartmentCardProps {
  node: DepartmentTreeNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddChild?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const DepartmentCard = ({
  node,
  depth,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
}: DepartmentCardProps) => {
  const indent = depth * 14;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: indent,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-md border px-2 py-1 text-xs transition ${
        isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/40'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex h-4 w-4 items-center justify-center rounded border border-border bg-background text-[9px] text-muted-foreground"
          aria-label={isExpanded ? 'Collapse department' : 'Expand department'}
        >
          {node.children.length > 0 ? (isExpanded ? '-' : '+') : ''}
        </button>
        <span className="text-[11px] font-medium text-foreground">
          {node.name}{' '}
          <span className="text-[10px] text-muted-foreground">
            ({node.employeeCount} employees)
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {node.roleCount > 0 && (
          <span className="text-[10px] text-muted-foreground">{node.roleCount} roles</span>
        )}
        {onAddChild && (
          <button
            type="button"
            className="rounded border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-primary/60 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
          >
            + Add Sub-department
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-[10px] text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};


