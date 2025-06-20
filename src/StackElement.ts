import { OP } from "@bsv/sdk";
import { OPCodeExplanation } from "./utils";

export function getOPName(op: number) : string {
    // OP[chunk.op] shows an error but it is not a bug, just the type checking mechinism overreacting.
    // @ts-ignore
    if (op in OP) return OP[op]
    if (op < OP.OP_PUSHDATA1 && op > OP.OP_0) return `Pushdata${op.toString(16)}bytes`;
    return 'Invalid op value'
}

export type StackElementType = "PendingPushdata" | "PendingOP" | "MainStackElement" | "AltStackElement";

let nextRenderID = 0;

export class StackElement {
  readonly renderID: number;
  readonly contentHex: string;  // a hex string that either represent the hex encoding of a OP code, or the hex encoding of a pushed data
  readonly type: StackElementType;
  readonly color: string;

  constructor(contentHexHex: string, type: StackElementType) {
    this.renderID = nextRenderID++;
    this.contentHex = contentHexHex;
    this.type = type;
    switch (this.type) {
      case "PendingPushdata":
        this.color = "lightgreen";
        break;
      case "PendingOP":
        this.color = "tomato";
        break;
      case "MainStackElement":
        this.color = "lightgreen";
        break;
      case "AltStackElement":
        this.color = "lightblue";
    }
  }

  getDisplayString() : string {
    switch (this.type) {
      case "PendingPushdata":
      case "MainStackElement":
      case "AltStackElement":
        if (this.contentHex.length > 3) return (this.contentHex.length / 2).toString() + "bytes hex String";
        else {
          return parseInt(this.contentHex, 16).toString();
        }
      case "PendingOP":
        return getOPName(parseInt(this.contentHex, 16));
    }
  }

  getDetailString() : string {
    switch (this.type) {
      case "PendingPushdata":
      case "MainStackElement":
      case "AltStackElement":
        return "0x" + this.contentHex;
      case "PendingOP":
        return "0x" + this.contentHex + "\n" + OPCodeExplanation[getOPName(parseInt(this.contentHex, 16))];
    }
  }

  triggersComputation() : boolean {
    // certain stack element triggers computation when pushed onto the stack
    if (this.type !== "PendingOP") return false;
    return parseInt(this.contentHex, 16) > OP.OP_NOP;
  }
}
