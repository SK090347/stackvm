#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assemble } from './assemble.js';
import { disassemble } from './disasm.js';
import { StackVM } from './vm.js';

function usage(): never {
  console.log(`stackvm — tiny bytecode stack VM

Usage:
  npx tsx src/cli.ts run <file.svm> [--slots N]
  npx tsx src/cli.ts disasm <file.svm>
  npx tsx src/cli.ts help

.svm is a small text bytecode format (see examples/).`);
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') usage();

  if (cmd === 'run' || cmd === 'disasm') {
    const file = args[1];
    if (!file) usage();
    let slots = 16;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--slots' && args[i + 1]) {
        slots = Number(args[++i]);
      }
    }

    const src = readFileSync(resolve(file), 'utf8');
    const { code } = assemble(src);

    if (cmd === 'disasm') {
      console.log(disassemble(code));
      return;
    }

    const vm = new StackVM(code);
    const result = vm.run(slots);
    for (const line of result.output) console.log(line);
    if (result.stack.length === 1) {
      // quiet unless there's a leftover value that wasn't printed
    }
    return;
  }

  usage();
}

main();
