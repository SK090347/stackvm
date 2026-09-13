import { describe, expect, it } from 'vitest';
import { assemble } from '../src/assemble.js';
import { Builder } from '../src/builder.js';
import { disassemble } from '../src/disasm.js';
import { Op } from '../src/opcodes.js';
import { StackVM } from '../src/vm.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('StackVM arithmetic', () => {
  it('adds and multiplies', () => {
    const code = new Builder().const(3).const(4).add().const(2).mul().halt().finish();
    const r = new StackVM(code).run();
    expect(r.stack.pop()).toBe(14);
  });

  it('handles sub/div/neg', () => {
    const code = new Builder()
      .const(10)
      .const(3)
      .sub()
      .const(2)
      .div()
      .neg()
      .halt()
      .finish();
    const r = new StackVM(code).run();
    expect(r.stack.pop()).toBe(-3.5);
  });

  it('compares with LT and EQ', () => {
    const a = new Builder().const(1).const(2).lt().halt().finish();
    expect(new StackVM(a).run().stack.pop()).toBe(1);
    const b = new Builder().const(5).const(5).eq().halt().finish();
    expect(new StackVM(b).run().stack.pop()).toBe(1);
    const c = new Builder().const(5).const(6).eq().halt().finish();
    expect(new StackVM(c).run().stack.pop()).toBe(0);
  });
});

describe('control flow', () => {
  it('jumps', () => {
    const code = new Builder()
      .const(1)
      .jump('end')
      .const(99) // skipped
      .label('end')
      .halt()
      .finish();
    const r = new StackVM(code).run();
    expect(r.stack.pop()).toBe(1);
  });

  it('jump_if_false', () => {
    const code = new Builder()
      .const(0)
      .jumpIfFalse('yes')
      .const(1)
      .halt()
      .label('yes')
      .const(42)
      .halt()
      .finish();
    expect(new StackVM(code).run().stack.pop()).toBe(42);
  });
});

describe('locals + call', () => {
  it('get/set local', () => {
    const code = new Builder()
      .const(7)
      .setLocal(0)
      .getLocal(0)
      .const(3)
      .add()
      .print()
      .halt()
      .finish();
    const r = new StackVM(code).run();
    expect(r.output).toEqual(['10']);
  });

  it('recursive factorial via builder', () => {
    // fact(n): if n < 2 return 1 else n * fact(n-1)
    const code = new Builder()
      .const(5)
      .call('fact', 1)
      .print()
      .halt()
      .label('fact')
      .getLocal(0)
      .const(2)
      .lt()
      .jumpIfFalse('rec')
      .const(1)
      .ret()
      .label('rec')
      .getLocal(0)
      .getLocal(0)
      .const(1)
      .sub()
      .call('fact', 1)
      .mul()
      .ret()
      .finish();

    const r = new StackVM(code).run();
    expect(r.output).toEqual(['120']);
  });
});

describe('.svm examples', () => {
  function runFile(name: string) {
    const src = readFileSync(resolve('examples', name), 'utf8');
    const { code } = assemble(src);
    return new StackVM(code).run();
  }

  it('arith.svm', () => {
    expect(runFile('arith.svm').output).toEqual(['13']);
  });

  it('factorial.svm', () => {
    expect(runFile('factorial.svm').output).toEqual(['720']);
  });

  it('fib.svm', () => {
    expect(runFile('fib.svm').output).toEqual(['55']);
  });
});

describe('assemble + disasm', () => {
  it('round-trips labels', () => {
    const src = `
      CONST 1
      JUMP skip
      CONST 0
      skip:
      PRINT
      HALT
    `;
    const { code, labels } = assemble(src);
    expect(labels.skip).toBeDefined();
    expect(code[0]).toBe(Op.CONST);
    const text = disassemble(code);
    expect(text).toContain('JUMP');
    expect(text).toContain('HALT');
  });

  it('rejects unknown opcode', () => {
    expect(() => assemble('FOOBAR 1')).toThrow(/unknown opcode/);
  });
});
