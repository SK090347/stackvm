import { nameToOp, Op, operandCount } from './opcodes.js';

/**
 * Tiny .svm text format:
 *
 *   ; comments with ; or #
 *   label:
 *   CONST 3.14
 *   ADD
 *   JUMP loop
 *   JUMP_IF_FALSE end
 *   CALL fib 1        ; addr label + arity
 *   GET_LOCAL 0
 *   SET_LOCAL 1
 *   PRINT
 *   RETURN
 *   HALT
 *   POP
 *
 * Labels resolve in a second pass. CALL takes a label and an arity integer.
 */
export interface AssembleResult {
  code: number[];
  labels: Record<string, number>;
}

export function assemble(source: string): AssembleResult {
  const rawLines = source.split(/\r?\n/);
  type Tok =
    | { kind: 'op'; op: Op; args: string[]; line: number }
    | { kind: 'label'; name: string; line: number };

  const tokens: Tok[] = [];
  let lineNo = 0;

  for (const raw of rawLines) {
    lineNo++;
    let line = raw.replace(/[;#].*$/, '').trim();
    if (!line) continue;

    // label-only or label + instr on same line
    const labelMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (labelMatch) {
      tokens.push({ kind: 'label', name: labelMatch[1]!, line: lineNo });
      line = labelMatch[2]!.trim();
      if (!line) continue;
    }

    const parts = line.split(/\s+/);
    const opName = parts[0]!;
    const op = nameToOp(opName);
    if (op === undefined) {
      throw new Error(`line ${lineNo}: unknown opcode '${opName}'`);
    }
    tokens.push({ kind: 'op', op, args: parts.slice(1), line: lineNo });
  }

  // pass 1: assign addresses
  const labels: Record<string, number> = {};
  let addr = 0;
  for (const t of tokens) {
    if (t.kind === 'label') {
      if (labels[t.name] !== undefined) {
        throw new Error(`line ${t.line}: duplicate label '${t.name}'`);
      }
      labels[t.name] = addr;
    } else {
      addr += 1 + operandCount(t.op);
    }
  }

  // pass 2: emit
  const code: number[] = [];
  for (const t of tokens) {
    if (t.kind === 'label') continue;

    const need = operandCount(t.op);
    if (t.args.length !== need) {
      throw new Error(
        `line ${t.line}: ${Op[t.op]} expects ${need} operand(s), got ${t.args.length}`,
      );
    }

    code.push(t.op);

    if (t.op === Op.CONST) {
      const n = Number(t.args[0]);
      if (Number.isNaN(n)) throw new Error(`line ${t.line}: bad CONST ${t.args[0]}`);
      code.push(n);
    } else if (t.op === Op.JUMP || t.op === Op.JUMP_IF_FALSE) {
      code.push(resolve(t.args[0]!, labels, t.line));
    } else if (t.op === Op.CALL) {
      code.push(resolve(t.args[0]!, labels, t.line));
      const arity = Number(t.args[1]);
      if (!Number.isInteger(arity) || arity < 0) {
        throw new Error(`line ${t.line}: bad CALL arity ${t.args[1]}`);
      }
      code.push(arity);
    } else if (t.op === Op.GET_LOCAL || t.op === Op.SET_LOCAL) {
      const slot = Number(t.args[0]);
      if (!Number.isInteger(slot) || slot < 0) {
        throw new Error(`line ${t.line}: bad local slot ${t.args[0]}`);
      }
      code.push(slot);
    }
  }

  return { code, labels };
}

function resolve(ref: string, labels: Record<string, number>, line: number): number {
  if (/^\d+$/.test(ref)) return Number(ref);
  const a = labels[ref];
  if (a === undefined) throw new Error(`line ${line}: unknown label '${ref}'`);
  return a;
}
