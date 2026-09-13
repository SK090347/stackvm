# stackvm


**Live demo:** https://sk090347.github.io/stackvm/
Small stack-based bytecode VM I wrote while poking at how interpreters actually run.

You feed it a flat `number[]` of opcodes (or a `.svm` text file), it keeps a value stack + call frames, and chugs along until `HALT`. Nothing fancy — no GC, no objects, just numbers.

## opcodes

`CONST` `ADD` `SUB` `MUL` `DIV` `NEG` `LT` `EQ` `JUMP` `JUMP_IF_FALSE` `CALL` `RETURN` `GET_LOCAL` `SET_LOCAL` `PRINT` `POP` `HALT`

Calls push a frame; locals are slots relative to that frame. Recursion works (see `examples/fib.svm`).

## try it

```bash
npm i
npm test
npx tsx src/cli.ts run examples/factorial.svm
npx tsx src/cli.ts run examples/fib.svm
npx tsx src/cli.ts disasm examples/arith.svm
```

`.svm` is homemade — labels, `;` comments, `CALL name arity`. Look at the examples, it's short.

## layout

- `src/vm.ts` — the machine
- `src/assemble.ts` — text → bytecode
- `src/builder.ts` — fluent builder for tests
- `src/disasm.ts` — dump
- `examples/` — factorial, fib, arith

Dual licensed MIT OR Apache-2.0. — Sumit (SK090347), Adamas University
