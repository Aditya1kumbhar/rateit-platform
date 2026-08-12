import { logger } from '../logger';

// --- AST Schema Definitions ---

export type Operator = 
  | '==' | '!=' | '>' | '>=' | '<' | '<='
  | 'IN' | 'NOT_IN';

export interface ASTCondition {
  var?: string;             // The variable to check (e.g., 'carState.speed')
  op?: Operator;            // The comparison operator
  val?: any;                // The value to compare against
  and?: ASTCondition[];     // Logical AND array
  or?: ASTCondition[];      // Logical OR array
}

export interface ASTRule {
  id: string;
  name: string;
  description: string;
  condition: ASTCondition;
  violation_msg: string;
}

export interface RuleExecutionResult {
  passed: boolean;
  checks: { rule: string; passed: boolean }[];
  violations: string[];
}

/**
 * Dynamic Rule Execution Engine
 * Evaluates JSON-based Abstract Syntax Trees (AST) against runtime state.
 */
export class ASTEngine {
  
  /**
   * Evaluates a complete ruleset against the given runtime context.
   */
  public evaluateRuleset(rules: ASTRule[], context: Record<string, any>): RuleExecutionResult {
    const checks: { rule: string; passed: boolean }[] = [];
    const violations: string[] = [];

    for (const rule of rules) {
      try {
        const passed = this.evaluateCondition(rule.condition, context);
        checks.push({ rule: rule.name, passed });
        
        if (!passed) {
          // Dynamic string interpolation for violation message (e.g. "Speed {carState.speed} exceeds limit")
          const msg = this.interpolateString(rule.violation_msg, context);
          violations.push(msg);
        }
      } catch (error: any) {
        logger.error('AST_Engine', `Failed to evaluate rule [${rule.id}]: ${error.message}`);
        checks.push({ rule: rule.name, passed: false });
        violations.push(`[SYSTEM ERROR] Rule ${rule.id} evaluation failed.`);
      }
    }

    return {
      passed: checks.every(c => c.passed),
      checks,
      violations
    };
  }

  /**
   * Recursively evaluates an AST Condition node.
   */
  private evaluateCondition(cond: ASTCondition, ctx: Record<string, any>): boolean {
    if (cond.and) {
      return cond.and.every(c => this.evaluateCondition(c, ctx));
    }
    
    if (cond.or) {
      return cond.or.some(c => this.evaluateCondition(c, ctx));
    }

    if (!cond.var || !cond.op || cond.val === undefined) {
      throw new Error(`Malformed AST Node: Missing var, op, or val. Node: ${JSON.stringify(cond)}`);
    }

    const actualValue = this.resolveVariable(cond.var, ctx);

    switch (cond.op) {
      case '==': return actualValue === cond.val;
      case '!=': return actualValue !== cond.val;
      case '>': return actualValue > cond.val;
      case '>=': return actualValue >= cond.val;
      case '<': return actualValue < cond.val;
      case '<=': return actualValue <= cond.val;
      case 'IN': return Array.isArray(cond.val) && cond.val.includes(actualValue);
      case 'NOT_IN': return Array.isArray(cond.val) && !cond.val.includes(actualValue);
      default:
        throw new Error(`Unknown operator: ${cond.op}`);
    }
  }

  /**
   * Resolves dot-notation variables (e.g., 'carState.speed') against the context object.
   */
  private resolveVariable(path: string, ctx: Record<string, any>): any {
    const keys = path.split('.');
    let current = ctx;
    
    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * Replaces {var.name} placeholders in strings with actual context values.
   */
  private interpolateString(template: string, ctx: Record<string, any>): string {
    return template.replace(/{([^}]+)}/g, (_, path) => {
      const val = this.resolveVariable(path.trim(), ctx);
      return val !== undefined ? String(val) : `{${path}}`;
    });
  }
}

export const ruleEngine = new ASTEngine();
