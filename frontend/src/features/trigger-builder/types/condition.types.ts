/**
 * Condition Builder Types
 * 
 * These types match the backend structure for conditions
 */

export type ConditionOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'starts_with'
  | 'ends_with'
  | 'before'
  | 'after'
  | 'between'
  | 'is_true'
  | 'is_false';

export interface ICondition {
  id: string; // For frontend tracking
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface IConditionGroup {
  id: string; // For frontend tracking
  operator: 'AND' | 'OR';
  conditions: (ICondition | IConditionGroup)[];
}

// Field type for determining available operators and input types
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'dropdown' | 'email' | 'url';

export interface IField {
  id: string;
  name: string;
  type: FieldType;
  label?: string;
  options?: Array<{ value: string; label: string }>; // For dropdown fields
  required?: boolean;
}

// Operator options by field type
export const OPERATORS_BY_TYPE: Record<FieldType, ConditionOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', '>=', '<=', 'between', 'is_null', 'is_not_null'],
  date: ['equals', 'before', 'after', 'between', 'is_null', 'is_not_null'],
  boolean: ['is_true', 'is_false'],
  dropdown: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
  email: ['equals', 'not_equals', 'contains', 'not_contains', 'is_null', 'is_not_null'],
  url: ['equals', 'not_equals', 'contains', 'not_contains', 'is_null', 'is_not_null'],
};

// Operator labels for display
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  '=': '=',
  '!=': '!=',
  '>': '>',
  '<': '<',
  '>=': '>=',
  '<=': '<=',
  contains: 'contains',
  not_contains: 'does not contain',
  in: 'in',
  not_in: 'not in',
  is_null: 'is null',
  is_not_null: 'is not null',
  equals: '=',
  not_equals: '!=',
  greater_than: '>',
  less_than: '<',
  starts_with: 'starts with',
  ends_with: 'ends with',
  before: 'before',
  after: 'after',
  between: 'between',
  is_true: 'is true',
  is_false: 'is false',
};

