import {Expressions, Nodes} from "abaplint";
import * as abaplint from "abaplint";
import {IExpressionTranspiler} from "./_expression_transpiler";
import {SourceTranspiler, CompareOperatorTranspiler} from ".";

export class CompareTranspiler implements IExpressionTranspiler {

  public transpile(node: Nodes.ExpressionNode, spaghetti: abaplint.SpaghettiScope, filename: string): string {
// todo, this is not correct
    const sources = node.findDirectExpressions(Expressions.Source);
    if (sources.length >= 2) {
      const operator = new CompareOperatorTranspiler().transpile(node.findFirstExpression(Expressions.CompareOperator)!);
      const s0 = new SourceTranspiler().transpile(sources[0], spaghetti, filename);
      const s1 = new SourceTranspiler().transpile(sources[1], spaghetti, filename);
      return "abap.compare." + operator + "(" + s0 + ", " + s1 + ")";
    }

    return "Compare, todo";
  }

}