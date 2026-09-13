import { Op } from './opcodes.js';

/** Fluent bytecode builder used by examples + tests. */
export class Builder {
  code: number[] = [];
  private labels = new Map<string, number>();
  private patches: { at: number; label: string }[] = [];

  const(n: number): this {
    this.code.push(Op.CONST, n);
    return this;
  }
  add(): this {
    this.code.push(Op.ADD);
    return this;
  }
  sub(): this {
    this.code.push(Op.SUB);
    return this;
  }
  mul(): this {
    this.code.push(Op.MUL);
    return this;
  }
  div(): this {
    this.code.push(Op.DIV);
    return this;
  }
  neg(): this {
    this.code.push(Op.NEG);
    return this;
  }
  lt(): this {
    this.code.push(Op.LT);
    return this;
  }
  eq(): this {
    this.code.push(Op.EQ);
    return this;
  }
  jump(label: string): this {
    this.code.push(Op.JUMP, 0);
    this.patches.push({ at: this.code.length - 1, label });
    return this;
  }
  jumpIfFalse(label: string): this {
    this.code.push(Op.JUMP_IF_FALSE, 0);
    this.patches.push({ at: this.code.length - 1, label });
    return this;
  }
  call(label: string, arity: number): this {
    this.code.push(Op.CALL, 0, arity);
    this.patches.push({ at: this.code.length - 2, label });
    return this;
  }
  ret(): this {
    this.code.push(Op.RETURN);
    return this;
  }
  getLocal(slot: number): this {
    this.code.push(Op.GET_LOCAL, slot);
    return this;
  }
  setLocal(slot: number): this {
    this.code.push(Op.SET_LOCAL, slot);
    return this;
  }
  print(): this {
    this.code.push(Op.PRINT);
    return this;
  }
  halt(): this {
    this.code.push(Op.HALT);
    return this;
  }
  pop(): this {
    this.code.push(Op.POP);
    return this;
  }

  label(name: string): this {
    this.labels.set(name, this.code.length);
    return this;
  }

  finish(): number[] {
    for (const p of this.patches) {
      const addr = this.labels.get(p.label);
      if (addr === undefined) throw new Error(`undefined label '${p.label}'`);
      this.code[p.at] = addr;
    }
    return this.code;
  }
}
