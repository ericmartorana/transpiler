import {Expressions, Nodes} from "@abaplint/core";
import {IExpressionTranspiler} from "./_expression_transpiler";
import {Traversal} from "../traversal";

export class CondSubTranspiler implements IExpressionTranspiler {

  public transpile(node: Nodes.ExpressionNode, traversal: Traversal): string {
    let ret = "";

    for (const c of node.getChildren()) {
      if (c.get() instanceof Expressions.Cond) {
        ret += traversal.traverse(c);
      } else if (c instanceof Nodes.TokenNode && c.getFirstToken().getStr() === "NOT") {
        ret += "!";
      } else if (c instanceof Nodes.TokenNode && c.getFirstToken().getStr().trim() === "(") {
        ret += "(";
      } else if (c instanceof Nodes.TokenNode && c.getFirstToken().getStr().trim() === ")") {
        ret += ")";
      }
    }

    return ret;
  }

}