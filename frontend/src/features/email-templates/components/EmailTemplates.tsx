import { useEffect, useState } from 'react';
import { emailService } from '../services/email.service';
import type { IEmailTemplate } from '../types/email.types';
import { EmailTemplateForm } from './EmailTemplateForm';
import { EmailTemplatePreview } from './EmailTemplatePreview';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Eye, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EmailTemplates() {
  const [templates, setTemplates] = useState<IEmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IEmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<IEmailTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [filterType, filterActive]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const type = filterType === 'all' ? undefined : filterType;
      const isActive =
        filterActive === 'all' ? undefined : filterActive === 'active' ? true : false;
      const data = await emailService.listTemplates(type, isActive);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load email templates', error);
      showToast({
        title: 'Failed to load templates',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: IEmailTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handlePreview = (template: IEmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await emailService.deleteTemplate(id);
      showToast({
        title: 'Template deleted',
        description: 'Email template has been deleted successfully',
        status: 'success',
      });
      loadTemplates();
      setDeleteTemplateId(null);
    } catch (error) {
      console.error('Failed to delete template', error);
      showToast({
        title: 'Failed to delete template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleToggleActive = async (template: IEmailTemplate) => {
    try {
      await emailService.updateTemplate(template.id, {
        isActive: !template.isActive,
      });
      showToast({
        title: 'Template updated',
        description: `Template ${!template.isActive ? 'activated' : 'deactivated'}`,
        status: 'success',
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to update template', error);
      showToast({
        title: 'Failed to update template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage email templates for automated notifications
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="type-filter" className="text-sm">Type:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger id="type-filter" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="approval_request">Approval Request</SelectItem>
              <SelectItem value="task_assigned">Task Assigned</SelectItem>
              <SelectItem value="flow_completed">Flow Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm">Status:</Label>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger id="status-filter" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading templates...</div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first email template to get started
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-md truncate">{template.subject}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {template.variables.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(template)}
                        className="h-8 w-8 p-0"
                        title={template.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {template.isActive ? '✓' : '○'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTemplateId(template.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
            </DialogTitle>
          </DialogHeader>
          <EmailTemplateForm
            template={editingTemplate}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewTemplate && (
        <EmailTemplatePreview
          template={previewTemplate}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTemplateId !== null} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && handleDelete(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

