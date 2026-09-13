import { Op, operandCount } from './opcodes.js';

export interface CallFrame {
  /** Return instruction pointer (next op after CALL). */
  returnIp: number;
  /** Stack index where this frame's locals begin. */
  base: number;
  /** Number of local slots reserved for this frame. */
  slotCount: number;
}

export interface RunResult {
  stack: number[];
  output: string[];
  halted: boolean;
}

export class StackVM {
  code: number[];
  stack: number[] = [];
  frames: CallFrame[] = [];
  ip = 0;
  output: string[] = [];
  maxSteps: number;

  constructor(code: number[], opts?: { maxSteps?: number }) {
    this.code = code;
    this.maxSteps = opts?.maxSteps ?? 1_000_000;
  }

  /** Push a root frame covering the whole program (locals start at 0). */
  reset(localSlots = 16): void {
    this.stack = new Array(localSlots).fill(0);
    this.frames = [{ returnIp: -1, base: 0, slotCount: localSlots }];
    this.ip = 0;
    this.output = [];
  }

  run(localSlots = 16): RunResult {
    this.reset(localSlots);
    let steps = 0;

    while (steps++ < this.maxSteps) {
      if (this.ip < 0 || this.ip >= this.code.length) {
        throw new Error(`ip out of bounds: ${this.ip}`);
      }

      const op = this.code[this.ip++] as Op;

      switch (op) {
        case Op.CONST: {
          const v = this.code[this.ip++];
          this.stack.push(v);
          break;
        }
        case Op.ADD: {
          const b = this.pop();
          const a = this.pop();
          this.stack.push(a + b);
          break;
        }
        case Op.SUB: {
          const b = this.pop();
          const a = this.pop();
          this.stack.push(a - b);
          break;
        }
        case Op.MUL: {
          const b = this.pop();
          const a = this.pop();
          this.stack.push(a * b);
          break;
        }
        case Op.DIV: {
          const b = this.pop();
          const a = this.pop();
          if (b === 0) throw new Error('division by zero');
          this.stack.push(a / b);
          break;
        }
        case Op.NEG: {
          this.stack.push(-this.pop());
          break;
        }
        case Op.LT: {
          const b = this.pop();
          const a = this.pop();
          this.stack.push(a < b ? 1 : 0);
          break;
        }
        case Op.EQ: {
          const b = this.pop();
          const a = this.pop();
          this.stack.push(a === b ? 1 : 0);
          break;
        }
        case Op.JUMP: {
          const addr = this.code[this.ip++];
          this.ip = addr;
          break;
        }
        case Op.JUMP_IF_FALSE: {
          const addr = this.code[this.ip++];
          const cond = this.pop();
          if (cond === 0) this.ip = addr;
          break;
        }
        case Op.CALL: {
          const addr = this.code[this.ip++];
          const arity = this.code[this.ip++];
          // args sit on top of stack; carve out local slots after them
          const args = [];
          for (let i = 0; i < arity; i++) args.unshift(this.pop());
          const base = this.stack.length;
          // locals[0..arity) = args, rest zeroed for extra locals
          const slotCount = Math.max(arity + 8, 8);
          for (let i = 0; i < slotCount; i++) {
            this.stack.push(i < arity ? args[i]! : 0);
          }
          this.frames.push({
            returnIp: this.ip,
            base,
            slotCount,
          });
          this.ip = addr;
          break;
        }
        case Op.RETURN: {
          const ret = this.pop();
          const frame = this.frames.pop();
          if (!frame || this.frames.length === 0) {
            // returning from root — treat as halt with value
            this.stack.length = 0;
            this.stack.push(ret);
            return { stack: [...this.stack], output: [...this.output], halted: true };
          }
          // unwind to caller's stack (drop callee locals)
          this.stack.length = frame.base;
          this.stack.push(ret);
          this.ip = frame.returnIp;
          break;
        }
        case Op.GET_LOCAL: {
          const slot = this.code[this.ip++];
          const frame = this.frames[this.frames.length - 1]!;
          this.stack.push(this.stack[frame.base + slot]!);
          break;
        }
        case Op.SET_LOCAL: {
          const slot = this.code[this.ip++];
          const frame = this.frames[this.frames.length - 1]!;
          const v = this.pop();
          this.stack[frame.base + slot] = v;
          break;
        }
        case Op.PRINT: {
          const v = this.pop();
          const s = String(v);
          this.output.push(s);
          break;
        }
        case Op.HALT:
          return { stack: [...this.stack], output: [...this.output], halted: true };
        case Op.POP:
          this.pop();
          break;
        default:
          throw new Error(`unknown opcode ${op} at ip ${this.ip - 1}`);
      }
    }

    throw new Error(`exceeded maxSteps (${this.maxSteps})`);
  }

  private pop(): number {
    if (this.stack.length === 0) throw new Error('stack underflow');
    return this.stack.pop()!;
  }
}

/** Rough size check helper used by the assembler. */
export function codeLength(code: number[]): number {
  let i = 0;
  let n = 0;
  while (i < code.length) {
    const op = code[i] as Op;
    i += 1 + operandCount(op);
    n++;
  }
  return n;
}
