import ts from "typescript";

import type { TsGenerator } from "../../api";
import * as Utils from "../../utils";

export interface StringItem {
  type: "string";
  value: string;
}

export interface ExpressionItem {
  type: "property";
  value: ts.Expression;
}

export type Item = StringItem | ExpressionItem;

export type Params$TemplateExpression = Item[];

const getTemplateSpan = (
  factory: TsGenerator.Factory.Type,
  currentIndex: number,
  nextIndex: number,
  lastIndex: number,
  currentItem: ExpressionItem,
  nextItem: Item | undefined,
): ts.TemplateSpan[] => {
  // == last
  if (!nextItem) {
    return [
      factory.TemplateSpan.create({
        expression: currentItem.value,
        literal: factory.TemplateTail.create({
          text: "",
        }),
      }),
    ];
  }

  if (nextItem.type === "property") {
    if (lastIndex === nextIndex) {
      return [
        factory.TemplateSpan.create({
          expression: currentItem.value,
          literal: factory.TemplateTail.create({
            text: "",
          }),
        }),
        factory.TemplateSpan.create({
          expression: nextItem.value,
          literal: factory.TemplateTail.create({
            text: "",
          }),
        }),
      ];
    } else {
      return [
        factory.TemplateSpan.create({
          expression: currentItem.value,
          literal: factory.TemplateTail.create({
            text: "",
          }),
        }),
        factory.TemplateSpan.create({
          expression: nextItem.value,
          literal: factory.TemplateMiddle.create({
            text: "",
          }),
        }),
      ];
    }
  } else {
    if (lastIndex === nextIndex) {
      return [
        factory.TemplateSpan.create({
          expression: currentItem.value,
          literal: factory.TemplateTail.create({
            text: nextItem.value,
          }),
        }),
      ];
    } else {
      return [
        factory.TemplateSpan.create({
          expression: currentItem.value,
          literal: factory.TemplateMiddle.create({
            text: nextItem.value,
          }),
        }),
      ];
    }
  }
};

/**
 *
 * ``
 * `a`
 * `${b}`
 * `a${b}`
 * `${a}${b}`
 * `${a}b${c}`
 * ``
 */
export const generateTemplateExpression = (factory: TsGenerator.Factory.Type, list: Params$TemplateExpression): ts.Expression => {
  if (list.length === 0) {
    return factory.NoSubstitutionTemplateLiteral.create({
      text: "",
    });
  }
  const templateHead = factory.TemplateHead.create({
    text: list[0].type === "property" ? "" : list[0].value,
  });

  const spanList = list.splice(1, list.length);
  if (spanList.length === 0 && list[0].type === "string") {
    return factory.NoSubstitutionTemplateLiteral.create({
      text: list[0].value,
    });
  }
  const lastIndex = spanList.length - 1;
  const restValue = lastIndex % 2;
  let templateSpans: ts.TemplateSpan[] = [];
  for (let i = 0; i <= (lastIndex - restValue) / 2; i++) {
    if (spanList.length === 0) {
      continue;
    }
    const currentIndex = 2 * i;
    const nextIndex = 2 * i + 1;
    const currentItem = spanList[currentIndex];
    const nextItem = spanList[nextIndex];
    if (currentItem.type === "string") {
      throw new Error("Logic Error");
    }
    templateSpans = templateSpans.concat(getTemplateSpan(factory, currentIndex, nextIndex, lastIndex, currentItem, nextItem));
  }
  return factory.TemplateExpression.create({
    head: templateHead,
    templateSpans: templateSpans,
  });
};

export const generateVariableIdentifier = (
  factory: TsGenerator.Factory.Type,
  name: string,
): ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression => {
  if (name.startsWith("/")) {
    throw new Error("can't start '/'. name=" + name);
  }
  const list = name.split(".");
  if (list.length === 1) {
    return factory.Identifier.create({
      name: name,
    });
  }
  const [n1, n2, ...rest] = list;
  const first = factory.PropertyAccessExpression.create({
    expression: n1,
    name: n2,
  });

  return rest.reduce<ts.PropertyAccessExpression | ts.ElementAccessExpression>((previous, current: string) => {
    if (Utils.isAvailableVariableName(current)) {
      return factory.PropertyAccessExpression.create({
        expression: previous,
        name: current,
      });
    }
    return factory.ElementAccessExpression.create({
      expression: previous,
      index: current,
    });
  }, first);
};

export interface LiteralExpressionObject {
  [key: string]: { type: "string" | "variable"; value: string };
}

export const generateObjectLiteralExpression = (
  factory: TsGenerator.Factory.Type,
  obj: LiteralExpressionObject,
  extraProperties: ts.PropertyAssignment[] = [],
): ts.ObjectLiteralExpression => {
  const properties = Object.entries(obj).map(([key, item]) => {
    const initializer =
      item.type === "variable" ? generateVariableIdentifier(factory, item.value) : factory.StringLiteral.create({ text: item.value });
    return factory.PropertyAssignment.create({
      name: Utils.escapeText(key),
      initializer,
    });
  });

  return factory.ObjectLiteralExpression.create({
    properties: extraProperties.concat(properties),
    multiLine: true,
  });
};

/**
 * "/{a}/b/{a}/c{a}/".split(new RegExp("({a})"))
 * => ["/", "{a}", "/b/", "{a}", "/c", "{a}", "/"]
 */
export const stringToArray = (text: string, delimiter: string): string[] => text.split(new RegExp(`(${delimiter})`));

export const multiSplitStringToArray = (text: string, delimiters: string[]): string[] => {
  return delimiters.reduce<string[]>(
    (current, delimiter) => {
      return current.reduce<string[]>((result, currentText) => {
        return result.concat(stringToArray(currentText, delimiter));
      }, []);
    },
    [text],
  );
};
