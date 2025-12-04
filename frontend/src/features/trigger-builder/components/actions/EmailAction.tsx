import { useForm } from 'react-hook-form';
import type { IEmailAction } from '../../types/action.types';

interface EmailActionProps {
  action: IEmailAction;
  onChange: (action: IEmailAction) => void;
}

type EmailActionFormData = {
  sendToType: 'role' | 'user' | 'email' | 'dynamic';
  recipient: string;
  subject: string;
  body: string;
  templateId?: string;
  includeTaskDetails: boolean;
  attachFiles: boolean;
};

export function EmailAction({ action, onChange }: EmailActionProps) {
  const { register, watch, formState: { errors } } = useForm<EmailActionFormData>({
    defaultValues: {
      sendToType: action.sendToType || 'email',
      recipient: typeof action.to === 'string' ? action.to : action.to?.[0] || '',
      subject: action.subject || '',
      body: action.body || '',
      templateId: action.templateId,
      includeTaskDetails: action.includeTaskDetails || false,
      attachFiles: action.attachFiles || false,
    },
  });

  const sendToType = watch('sendToType');
  const recipient = watch('recipient');
  const subject = watch('subject');
  const body = watch('body');
  const templateId = watch('templateId');
  const includeTaskDetails = watch('includeTaskDetails');
  const attachFiles = watch('attachFiles');

  const handleChange = () => {
    onChange({
      type: 'email',
      sendToType: sendToType,
      to: recipient,
      subject: subject,
      body: body,
      templateId: templateId,
      includeTaskDetails: includeTaskDetails,
      attachFiles: attachFiles,
    });
  };

  return (
    <div className="space-y-4">
      {/* Send To Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Send To
        </label>
        <div className="flex gap-4">
          {(['role', 'user', 'email', 'dynamic'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={type}
                {...register('sendToType', { onChange: handleChange })}
                className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Recipient */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Recipient
        </label>
        {sendToType === 'email' ? (
          <input
            type="email"
            {...register('recipient', {
              required: 'Recipient is required',
              onChange: handleChange,
            })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="email@example.com"
          />
        ) : sendToType === 'role' ? (
          <select
            {...register('recipient', { required: 'Recipient is required', onChange: handleChange })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
            {/* TODO: Fetch actual roles */}
          </select>
        ) : sendToType === 'user' ? (
          <select
            {...register('recipient', { required: 'Recipient is required', onChange: handleChange })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select User</option>
            {/* TODO: Fetch actual users */}
          </select>
        ) : (
          <input
            type="text"
            {...register('recipient', { required: 'Recipient is required', onChange: handleChange })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Dynamic field reference"
          />
        )}
        {errors.recipient && (
          <p className="mt-1 text-xs text-red-400">{errors.recipient.message}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Subject
        </label>
        <input
          type="text"
          {...register('subject', {
            required: 'Subject is required',
            onChange: handleChange,
          })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Email subject"
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Template */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Template
        </label>
        <select
          {...register('templateId', { onChange: handleChange })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">No Template</option>
          <option value="approval-request">Approval Request</option>
          <option value="notification">Notification</option>
          {/* TODO: Fetch actual templates */}
        </select>
      </div>

      {/* Body */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Body
        </label>
        <textarea
          {...register('body', {
            required: 'Body is required',
            onChange: handleChange,
          })}
          rows={4}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Email body"
        />
        {errors.body && (
          <p className="mt-1 text-xs text-destructive">{errors.body.message}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            {...register('includeTaskDetails', { onChange: handleChange })}
            className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">Include task details</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            {...register('attachFiles', { onChange: handleChange })}
            className="h-4 w-4 rounded border border-border bg-background text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">Attach files</span>
        </label>
      </div>
    </div>
  );
}

