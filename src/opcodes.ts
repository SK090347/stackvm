/** Bytecode opcodes for the stack VM. */
export enum Op {
  CONST = 0,
  ADD = 1,
  SUB = 2,
  MUL = 3,
  DIV = 4,
  NEG = 5,
  LT = 6,
  EQ = 7,
  JUMP = 8,
  JUMP_IF_FALSE = 9,
  CALL = 10,
  RETURN = 11,
  GET_LOCAL = 12,
  SET_LOCAL = 13,
  PRINT = 14,
  HALT = 15,
  POP = 16,
}

export const OP_NAMES: Record<Op, string> = {
  [Op.CONST]: 'CONST',
  [Op.ADD]: 'ADD',
  [Op.SUB]: 'SUB',
  [Op.MUL]: 'MUL',
  [Op.DIV]: 'DIV',
  [Op.NEG]: 'NEG',
  [Op.LT]: 'LT',
  [Op.EQ]: 'EQ',
  [Op.JUMP]: 'JUMP',
  [Op.JUMP_IF_FALSE]: 'JUMP_IF_FALSE',
  [Op.CALL]: 'CALL',
  [Op.RETURN]: 'RETURN',
  [Op.GET_LOCAL]: 'GET_LOCAL',
  [Op.SET_LOCAL]: 'SET_LOCAL',
  [Op.PRINT]: 'PRINT',
  [Op.HALT]: 'HALT',
  [Op.POP]: 'POP',
};

/** How many immediate operands each opcode consumes from the code stream. */
export function operandCount(op: Op): number {
  switch (op) {
    case Op.CONST:
    case Op.JUMP:
    case Op.JUMP_IF_FALSE:
    case Op.GET_LOCAL:
    case Op.SET_LOCAL:
      return 1;
    case Op.CALL:
      return 2; // addr, arity
    default:
      return 0;
  }
}

export function nameToOp(name: string): Op | undefined {
  const upper = name.toUpperCase();
  for (const [k, v] of Object.entries(OP_NAMES)) {
    if (v === upper) return Number(k) as Op;
  }
  return undefined;
}
