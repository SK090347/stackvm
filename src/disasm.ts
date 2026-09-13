import { Op, OP_NAMES, operandCount } from './opcodes.js';

/** Pretty-print bytecode as address-tagged lines. */
export function disassemble(code: number[]): string {
  const lines: string[] = [];
  let i = 0;
  while (i < code.length) {
    const addr = i;
    const op = code[i++] as Op;
    const name = OP_NAMES[op] ?? `OP_${op}`;
    const n = operandCount(op);
    const args: string[] = [];
    for (let k = 0; k < n; k++) {
      if (i >= code.length) {
        args.push('??');
      } else {
        args.push(String(code[i++]));
      }
    }
    const pad = String(addr).padStart(4, ' ');
    lines.push(args.length ? `${pad}  ${name} ${args.join(' ')}` : `${pad}  ${name}`);
  }
  return lines.join('\n');
}
