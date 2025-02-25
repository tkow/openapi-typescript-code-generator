import ts from "typescript";

import { UnSupportError } from "../../Exception";
import * as LiteralTypeNode from "./LiteralTypeNode";
import * as UnionTypeNode from "./UnionTypeNode";

export interface StringParams {
  type: "string";
  enum?: string[];
}

export interface IntegerParams {
  type: "integer";
  enum?: number[];
}

export interface NumberParams {
  type: "number";
  enum?: number[];
}

export interface BooleanParams {
  type: "boolean";
}

export interface ObjectParams {
  type: "object";
  value: ts.TypeElement[];
}

export interface UndefinedParams {
  type: "undefined";
}

export interface ArrayParams {
  type: "array";
  value: ts.TypeNode;
}

export interface NullParams {
  type: "null";
}

export interface NeverParams {
  type: "never";
}

export interface AnyParams {
  type: "any";
}

export interface VoidParams {
  type: "void";
}

export type Params$Create =
  | StringParams
  | IntegerParams
  | NumberParams
  | BooleanParams
  | ObjectParams
  | ArrayParams
  | UndefinedParams
  | NullParams
  | VoidParams
  | NeverParams
  | AnyParams;

export interface Factory {
  create: (params: Params$Create) => ts.TypeNode;
}

export const create = (context: Pick<ts.TransformationContext, "factory">): Factory["create"] => (params: Params$Create): ts.TypeNode => {
  const { factory } = context;
  const literalTypeNode = LiteralTypeNode.create(context);
  const unionTypeNode = UnionTypeNode.create(context);
  const createNode = () => {
    switch (params.type) {
      case "string":
        if (params.enum) {
          return unionTypeNode({
            typeNodes: params.enum.map(value => literalTypeNode({ value })),
          });
        }
        return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
      case "number":
      case "integer":
        if (params.enum) {
          return unionTypeNode({
            typeNodes: params.enum.map(value => literalTypeNode({ value })),
          });
        }
        return factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
      case "boolean":
        return factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
      case "object":
        return factory.createTypeLiteralNode(params.value);
      case "undefined":
        return factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
      case "null":
        return factory.createLiteralTypeNode(factory.createNull());
      case "array":
        return factory.createArrayTypeNode(params.value);
      case "never":
        return factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
      case "void":
        return factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
      case "any":
        return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      default:
        throw new UnSupportError(`UnSupport Type: ${JSON.stringify(params)}`);
    }
  };
  const node = createNode();
  return node;
};

export const make = (context: Pick<ts.TransformationContext, "factory">): Factory => {
  return {
    create: create(context),
  };
};
