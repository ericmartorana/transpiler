import * as abaplint from "abaplint";
import {IStatementTranspiler} from "./_statement_transpiler";

export class EndMethodTranspiler implements IStatementTranspiler {

  public transpile(_node: abaplint.Nodes.StatementNode): string {
    return "}";
  }

}