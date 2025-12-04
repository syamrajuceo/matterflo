import {
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Upload,
  Image,
  FileText,
  Folder,
} from 'lucide-react';
import type { FieldType } from '../types/task.types';

interface FieldTypeOption {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const fieldTypes: FieldTypeOption[] = [
  {
    type: 'text',
    label: 'Text',
    icon: <Type className="w-4 h-4" />,
    description: 'Single line text input',
  },
  {
    type: 'number',
    label: 'Number',
    icon: <Hash className="w-4 h-4" />,
    description: 'Numeric input',
  },
  {
    type: 'date',
    label: 'Date',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Date picker',
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: <List className="w-4 h-4" />,
    description: 'Single select dropdown',
  },
  {
    type: 'multi-select',
    label: 'Multi-Select',
    icon: <List className="w-4 h-4" />,
    description: 'Multiple selection',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: <CheckSquare className="w-4 h-4" />,
    description: 'True/false checkbox',
  },
  {
    type: 'file',
    label: 'File',
    icon: <Upload className="w-4 h-4" />,
    description: 'File upload',
  },
  {
    type: 'image',
    label: 'Image',
    icon: <Image className="w-4 h-4" />,
    description: 'Image upload',
  },
  {
    type: 'rich-text',
    label: 'Rich Text',
    icon: <FileText className="w-4 h-4" />,
    description: 'Rich text editor',
  },
  {
    type: 'field-group',
    label: 'Field Group',
    icon: <Folder className="w-4 h-4" />,
    description: 'Group of fields',
  },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-2">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center">Fields</h2>
      </div>

      {/* Field Types List */}
      <div className="flex-1 overflow-y-auto p-1">
        {fieldTypes.map((fieldType) => (
          <button
            key={fieldType.type}
            onClick={() => onAddField(fieldType.type)}
            className="group mb-1 w-full rounded-md bg-slate-50 p-1.5 text-center transition hover:bg-blue-50 hover:border-blue-200 border border-transparent flex flex-col items-center justify-center"
            title={`${fieldType.label}: ${fieldType.description}`}
          >
            <div className="rounded bg-white p-1 text-slate-500 transition group-hover:text-blue-600 mb-0.5 shadow-sm">
              {fieldType.icon}
            </div>
            <div className="text-[8px] font-medium text-slate-600 leading-tight text-center group-hover:text-blue-700">
              {fieldType.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

