import type { ICondition, IConditionGroup, ITrigger } from './trigger.types';

export class TriggerEvaluator {
  private visitedPaths: Set<string> = new Set();
  private readonly MAX_DEPTH = 10;
  private depth = 0;

  /**
   * Evaluate trigger conditions against event data
   */
  evaluate(trigger: ITrigger, eventData: Record<string, any>): { met: boolean; result: any } {
    this.visitedPaths.clear();
    this.depth = 0;

    if (!trigger.conditions) {
      // No conditions means always true
      return { met: true, result: { type: 'no_conditions' } };
    }

    try {
      const result = this.evaluateConditionOrGroup(trigger.conditions, eventData);
      return {
        met: result,
        result: {
          type: 'evaluated',
          result,
          conditions: trigger.conditions,
        },
      };
    } catch (error) {
      console.error('Error evaluating trigger conditions:', error);
      return {
        met: false,
        result: {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Evaluate a single condition or condition group
   */
  private evaluateConditionOrGroup(
    conditionOrGroup: ICondition | IConditionGroup,
    data: Record<string, any>
  ): boolean {
    if (this.depth > this.MAX_DEPTH) {
      throw new Error('Maximum condition nesting depth exceeded');
    }

    // Check if it's a group
    if ('operator' in conditionOrGroup && 'conditions' in conditionOrGroup) {
      return this.evaluateGroup(conditionOrGroup, data);
    } else {
      return this.evaluateCondition(conditionOrGroup as ICondition, data);
    }
  }

  /**
   * Evaluate a condition group (AND/OR logic)
   */
  private evaluateGroup(group: IConditionGroup, data: Record<string, any>): boolean {
    this.depth++;
    try {
      const results = group.conditions.map((condition) =>
        this.evaluateConditionOrGroup(condition, data)
      );

      if (group.operator === 'AND') {
        return results.every((result) => result === true);
      } else {
        // OR
        return results.some((result) => result === true);
      }
    } finally {
      this.depth--;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: ICondition, data: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);

    switch (condition.operator) {
      case '=':
        return this.compareValues(fieldValue, condition.value, 'equals');
      case '!=':
        return !this.compareValues(fieldValue, condition.value, 'equals');
      case '>':
        return this.compareValues(fieldValue, condition.value, 'greater');
      case '<':
        return this.compareValues(fieldValue, condition.value, 'less');
      case '>=':
        return (
          this.compareValues(fieldValue, condition.value, 'equals') ||
          this.compareValues(fieldValue, condition.value, 'greater')
        );
      case '<=':
        return (
          this.compareValues(fieldValue, condition.value, 'equals') ||
          this.compareValues(fieldValue, condition.value, 'less')
        );
      case 'contains':
        return this.stringContains(fieldValue, condition.value);
      case 'not_contains':
        return !this.stringContains(fieldValue, condition.value);
      case 'in':
        return this.isInArray(fieldValue, condition.value);
      case 'not_in':
        return !this.isInArray(fieldValue, condition.value);
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Get field value from nested object using dot notation
   */
  private getFieldValue(data: Record<string, any>, fieldPath: string): any {
    const path = fieldPath.split('.');
    let value = data;

    for (const key of path) {
      if (value === null || value === undefined) {
        return undefined;
      }
      if (typeof value !== 'object') {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * Compare two values with type coercion
   */
  private compareValues(
    a: any,
    b: any,
    operation: 'equals' | 'greater' | 'less'
  ): boolean {
    // Handle null/undefined
    if (a === null || a === undefined) {
      return false;
    }
    if (b === null || b === undefined) {
      return false;
    }

    // Try to coerce to numbers if both are numeric strings
    const numA = Number(a);
    const numB = Number(b);
    const bothNumeric = !isNaN(numA) && !isNaN(numB) && isFinite(numA) && isFinite(numB);

    if (bothNumeric) {
      switch (operation) {
        case 'equals':
          return numA === numB;
        case 'greater':
          return numA > numB;
        case 'less':
          return numA < numB;
      }
    }

    // String comparison
    const strA = String(a);
    const strB = String(b);

    switch (operation) {
      case 'equals':
        return strA === strB;
      case 'greater':
        return strA > strB;
      case 'less':
        return strA < strB;
    }
  }

  /**
   * Check if string contains substring
   */
  private stringContains(value: any, substring: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    const strValue = String(value).toLowerCase();
    const strSubstring = String(substring).toLowerCase();
    return strValue.includes(strSubstring);
  }

  /**
   * Check if value is in array
   */
  private isInArray(value: any, array: any): boolean {
    if (!Array.isArray(array)) {
      return false;
    }
    return array.some((item) => this.compareValues(value, item, 'equals'));
  }
}

