import {ESLintUtils, TSESTree} from "@typescript-eslint/utils";
import * as ts from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/magieno/pristine-ts/tree/master/packages/eslint-plugin#${name}`,
);

type MessageId =
  | "missingFromMap"
  | "typeMismatch"
  | "nonLiteralKey";

/**
 * For a parameter decorated with `@injectConfig(KEY)`, verifies that the parameter's
 * declared TypeScript type is assignable to the value type recorded for KEY in
 * `PristineConfigurationValueMap` (from `@pristine-ts/common`).
 *
 * Why a lint rule and not a type system check:
 *   TypeScript parameter decorators have no API to constrain the static type of the
 *   parameter they decorate. The decorator's argument and the parameter's type live in
 *   separate worlds at the type level. This rule bridges them at lint time.
 *
 * Requirements on the consuming project:
 *   - Typed linting must be enabled (`parserOptions.project` set in the ESLint config).
 *   - At least one `@pristine-ts/*` package that augments `PristineConfigurationValueMap`
 *     must be in the import graph of every file the rule lints.
 */
export const injectConfigTypeMatch = createRule<[], MessageId>({
  name: "inject-config-type-match",
  meta: {
    type: "problem",
    docs: {
      description:
        "Verify that the declared parameter type matches the value type registered for the @injectConfig key in PristineConfigurationValueMap.",
    },
    schema: [],
    messages: {
      missingFromMap:
        "Configuration key '{{key}}' is not declared in PristineConfigurationValueMap. " +
        "Either the key is misspelled, or the package that owns it does not augment the global map yet.",
      typeMismatch:
        "Parameter type '{{actual}}' is not assignable to expected type '{{expected}}' for configuration key '{{key}}'.",
      nonLiteralKey:
        "@injectConfig requires a literal-string key (or a constant from a *ConfigurationKeys object) so the value type can be checked at lint time. Got non-literal expression.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      Decorator(decoratorNode: TSESTree.Decorator) {
        // We're only interested in `@injectConfig(...)`. Skip everything else.
        if (
          decoratorNode.expression.type !== "CallExpression" ||
          decoratorNode.expression.callee.type !== "Identifier" ||
          decoratorNode.expression.callee.name !== "injectConfig"
        ) {
          return;
        }

        // Decorator must be on a parameter. In the @typescript-eslint AST, decorated
        // parameters appear either as `TSParameterProperty` (constructor params with
        // `public`/`private`/`readonly`/`protected` modifiers) or as plain `Identifier`
        // (typed function params). Anything else is not a parameter and we skip.
        const parentType = decoratorNode.parent.type;
        if (parentType !== "TSParameterProperty" && parentType !== "Identifier") {
          return;
        }

        const callExpr = decoratorNode.expression;
        if (callExpr.arguments.length === 0) return;
        const keyArg = callExpr.arguments[0];

        // Get the type of the key argument. We need a literal-string type.
        const keyTsNode = services.esTreeNodeToTSNodeMap.get(keyArg);
        if (keyTsNode === undefined) return;
        const keyType = checker.getTypeAtLocation(keyTsNode);

        const keyString = extractStringLiteral(keyType);
        if (keyString === undefined) {
          context.report({
            node: keyArg,
            messageId: "nonLiteralKey",
          });
          return;
        }

        // Look up the key in the merged PristineConfigurationValueMap.
        const expectedType = lookupExpectedType(checker, services.program, keyString, keyTsNode);
        if (expectedType === undefined) {
          context.report({
            node: keyArg,
            messageId: "missingFromMap",
            data: {key: keyString},
          });
          return;
        }

        // Find the parameter node and its declared type.
        const paramNode = findParameterNode(decoratorNode);
        if (paramNode === undefined) return;
        const paramTsNode = services.esTreeNodeToTSNodeMap.get(paramNode);
        if (paramTsNode === undefined || !ts.isParameter(paramTsNode)) return;
        if (paramTsNode.type === undefined) return;  // implicit any — skip
        const declaredType = checker.getTypeAtLocation(paramTsNode.type);

        // We compare in both directions: the parameter must be a supertype-or-equal of
        // the expected value type. Strict equality would be too tight (e.g. the value
        // could be `string` and the parameter `string | undefined`); structural
        // assignability captures the "the value the framework produces fits in your
        // parameter slot" intent.
        const ok = checker.isTypeAssignableTo(expectedType, declaredType);
        if (!ok) {
          context.report({
            node: paramNode,
            messageId: "typeMismatch",
            data: {
              key: keyString,
              expected: checker.typeToString(expectedType),
              actual: checker.typeToString(declaredType),
            },
          });
        }
      },
    };
  },
});

/**
 * If `t` is a single literal-string type or a union containing exactly one literal-string
 * member, return that string. Otherwise undefined. (We do not collapse general unions —
 * it'd be ambiguous which member to use as the lookup key.)
 */
function extractStringLiteral(t: ts.Type): string | undefined {
  if (t.isStringLiteral()) {
    return t.value;
  }
  return undefined;
}

/**
 * Look up `key` in the merged `PristineConfigurationValueMap` interface from
 * `@pristine-ts/common`. Returns the expected value type, or undefined if the key is
 * not declared anywhere in the import graph.
 */
function lookupExpectedType(
  checker: ts.TypeChecker,
  program: ts.Program,
  key: string,
  contextNode: ts.Node,
): ts.Type | undefined {
  // Find the PristineConfigurationValueMap symbol via the type checker. We use the
  // checker's symbol table as seen from contextNode — that's the full augmented map.
  const valueMapSymbol = findGlobalSymbol(program, checker, "PristineConfigurationValueMap", contextNode);
  if (valueMapSymbol === undefined) return undefined;

  // Build the type from the symbol, then index it by the literal key.
  const valueMapType = checker.getDeclaredTypeOfSymbol(valueMapSymbol);
  const property = valueMapType.getProperty(key);
  if (property === undefined) return undefined;
  return checker.getTypeOfSymbolAtLocation(property, contextNode);
}

/**
 * Walk the program's source files looking for an interface declaration whose name
 * matches `name`. Returns its symbol — which, after declaration merging, transparently
 * includes every augmentation across the import graph.
 */
function findGlobalSymbol(
  program: ts.Program,
  checker: ts.TypeChecker,
  name: string,
  contextNode: ts.Node,
): ts.Symbol | undefined {
  for (const sourceFile of program.getSourceFiles()) {
    const visit = (node: ts.Node): ts.Symbol | undefined => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === name) {
        const sym = checker.getSymbolAtLocation(node.name);
        if (sym !== undefined) return sym;
      }
      let found: ts.Symbol | undefined;
      ts.forEachChild(node, child => {
        if (found !== undefined) return;
        found = visit(child);
      });
      return found;
    };
    const found = visit(sourceFile);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * Walk up from a decorator node to find the containing parameter (regular or
 * constructor parameter property).
 */
function findParameterNode(decoratorNode: TSESTree.Decorator): TSESTree.Node | undefined {
  const parent = decoratorNode.parent;
  if (parent.type === "TSParameterProperty") return parent;
  if (parent.type === "Identifier" && parent.parent?.type === "FunctionExpression") return parent;
  // Fall back: if the decorator is attached directly to an Identifier inside a method
  // signature, walk up to find the parameter.
  let current: TSESTree.Node = parent;
  while (current.parent !== undefined) {
    if (current.type === "TSParameterProperty") return current;
    if (current.type === "Identifier" && (current as any).typeAnnotation !== undefined) return current;
    current = current.parent;
  }
  return undefined;
}
