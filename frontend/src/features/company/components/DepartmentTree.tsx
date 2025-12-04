import { useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCompanyStore } from '../store/companyStore';
import type { DepartmentTreeNode } from '../services/company.service';
import { companyService } from '../services/company.service';
import { DepartmentCard } from './DepartmentCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface DepartmentTreeProps {
  onSelectDepartment?: (id: string) => void;
  onAddSubDepartment?: (parentId: string) => void;
  onEditDepartment?: (id: string) => void;
  onDeleteDepartment?: (id: string) => void;
}

export const DepartmentTree = ({
  onSelectDepartment,
  onAddSubDepartment,
  onEditDepartment,
  onDeleteDepartment,
}: DepartmentTreeProps) => {
  const { tree, selectedDepartmentId, setSelectedDepartmentId, setTree, setIsLoading } =
    useCompanyStore();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const sensors = useSensors(useSensor(PointerSensor));

  const hasDepartments = tree && tree.length > 0;

  const visibleTree = useMemo(() => tree, [tree]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setSelectedDepartmentId(id);
    if (onSelectDepartment) {
      onSelectDepartment(id);
    }
  };

  const renderNode = (node: DepartmentTreeNode, depth: number): JSX.Element => {
    const isExpanded = expanded.has(node.id) || depth === 0;
    const isSelected = selectedDepartmentId === node.id;

    return (
      <div key={node.id} className="space-y-1">
        <DepartmentCard
          node={node}
          depth={depth}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onToggle={() => toggle(node.id)}
          onSelect={() => handleSelect(node.id)}
          onAddChild={onAddSubDepartment ? () => onAddSubDepartment(node.id) : undefined}
          onEdit={onEditDepartment ? () => onEditDepartment(node.id) : undefined}
          onDelete={onDeleteDepartment ? () => onDeleteDepartment(node.id) : undefined}
        />
        {isExpanded &&
          node.children.map((child) => (
            <div key={child.id}>{renderNode(child, depth + 1)}</div>
          ))}
      </div>
    );
  };

  if (!hasDepartments) {
    return (
      <div className="px-1 py-2 text-xs text-muted-foreground">
        No departments found. Use &quot;+ New Department&quot; to create one.
      </div>
    );
  }

  const getAllDepartmentIds = (nodes: DepartmentTreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (node: DepartmentTreeNode) => {
      ids.push(node.id);
      node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return ids;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceId = String(active.id);
    const targetId = String(over.id);

    // Find the target department node
    const findNode = (nodes: DepartmentTreeNode[], id: string): DepartmentTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
      }
      return null;
    };

    const targetNode = findNode(tree, targetId);
    if (!targetNode) return;

    try {
      setIsLoading(true);
      // Move source to be a child of target (or null for root)
      await companyService.moveDepartment(sourceId, targetId);
      const updated = await companyService.getHierarchyTree();
      setTree(updated);
      showToast({
        title: 'Department moved',
        description: 'The department has been moved in the hierarchy.',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to move department', error);
      showToast({
        title: 'Failed to move department',
        description: 'Please try again after reloading the page.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allIds = getAllDepartmentIds(visibleTree);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        <ScrollArea className="h-full">
          <div className="space-y-1 px-1 py-2">
            {visibleTree.map((node) => renderNode(node, 0))}
          </div>
        </ScrollArea>
      </SortableContext>
    </DndContext>
  );
};


