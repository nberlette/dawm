// deno-lint-ignore-file no-fallthrough
import type { Node } from "./index.ts";
import type { AST, AttributeToken } from "parsel-js";
import {
  parse,
  specificity as getSpecificity,
  specificityToNumber,
} from "parsel-js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export function walkSync(
  node: Node,
  callback: (node: Node, parent?: Node | null, index?: number) => void,
  parent?: Node | null,
): void {
  const childNodes = node.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    callback(child, parent ?? node, i);
    walkSync(child, callback, parent ?? node);
  }
}

export function specificity(selector: string) {
  return specificityToNumber(getSpecificity(selector), 10);
}

export function matches(node: Node, selector: string): boolean {
  const match = selectorToMatch(selector);
  return match(node, node.parentNode, nthChildIndex(node, node.parentNode));
}

export function querySelector<T extends Node>(
  node: Node,
  selector: string,
): T | null;
export function querySelector(node: Node, selector: string): Node | null {
  const match = selectorToMatch(selector);
  try {
    return select(
      node,
      (n, parent, index) => {
        const m = match(n, parent, index);
        if (!m) return false;
        return m;
      },
      { single: true },
    )[0];
  } catch {
    return null;
  }
}

export function querySelectorAll<T extends Node>(
  node: Node,
  selector: string,
): T[];
export function querySelectorAll(node: Node, selector: string): Node[];
export function querySelectorAll(node: Node, selector: string): Node[] {
  const match = selectorToMatch(selector);
  return select(node, (n, parent, index) => {
    const m = match(n, parent, index);
    if (!m) return false;
    return m;
  });
}

export default querySelectorAll;

interface Matcher {
  (n: Node, parent?: Node | null, index?: number): boolean;
}

function select(
  node: Node,
  match: Matcher,
  opts: { single?: boolean } = { single: false },
): Node[] {
  const nodes: Node[] = [];
  walkSync(node, (n, parent, index) => {
    if (n && n.nodeType !== ELEMENT_NODE) return;
    if (match(n, parent, index)) {
      if (opts.single) throw n;
      nodes.push(n);
    }
  });
  return nodes;
}

const getAttributeMatch = (
  selector: AttributeToken,
): (a: string, b: string) => boolean => {
  const { operator = "=" } = selector;
  switch (operator) {
    case "=":
      return (a: string, b: string) => a === b;
    case "~=":
      return (a: string, b: string) => a.split(/\s+/g).includes(b);
    case "|=":
      return (a: string, b: string) => a.startsWith(b + "-");
    case "*=":
      return (a: string, b: string) => a.indexOf(b) > -1;
    case "$=":
      return (a: string, b: string) => a.endsWith(b);
    case "^=":
      return (a: string, b: string) => a.startsWith(b);
  }
  return (_, __) => false;
};

const nthChildIndex = (node: Node, parent?: Node | null) =>
  [...parent?.childNodes ?? []]
    .filter((n: Node) => n.nodeType === ELEMENT_NODE)
    .findIndex((n: Node) => n === node);
const nthChild = (formula: string) => {
  let [_, A = "1", B = "0"] =
    /^\s*(?:(-?(?:\d+)?)n)?\s*\+?\s*(\d+)?\s*$/gm.exec(formula) ?? [];
  if (A.length === 0) A = "1";
  const a = Number.parseInt(A === "-" ? "-1" : A);
  const b = Number.parseInt(B);
  return (n: number) => a * n + b;
};
const lastChild = (node: Node, parent?: Node | null) =>
  [...parent?.childNodes ?? []].filter((n) => n.nodeType === ELEMENT_NODE)
    .pop() === node;
const firstChild = (node: Node, parent?: Node | null) =>
  [...parent?.childNodes ?? []].filter((n) => n.nodeType === ELEMENT_NODE)
    .shift() ===
    node;
const onlyChild = (_node: Node, parent?: Node | null) =>
  [...parent?.childNodes ?? []].filter((n) => n.nodeType === ELEMENT_NODE)
    .length === 1;

const createMatch = (selector: AST): Matcher => {
  switch (selector.type) {
    case "type":
      return (node: Node) => {
        if (selector.content === "*") return true;
        return node.nodeName === selector.name;
      };
    case "class":
      return (node: Node) =>
        node.attributes?.getNamedItem("class")?.value.split(/\s+/g).includes(
          selector.name,
        ) ?? false;
    case "id":
      return (node: Node) =>
        node.attributes?.getNamedItem("id")?.value === selector.name;
    case "pseudo-class": {
      switch (selector.name) {
        case "global":
          return (...args) =>
            selectorToMatch(parse(selector.argument!)!)(...args);
        case "not":
          return (...args) => !createMatch(selector.subtree!)(...args);
        case "is":
          return (...args) => selectorToMatch(selector.subtree!)(...args);
        case "where":
          return (...args) => selectorToMatch(selector.subtree!)(...args);
        case "root":
          return (node) =>
            node.nodeType === ELEMENT_NODE && node.nodeName === "html";
        case "empty":
          return (node) =>
            node.nodeType === ELEMENT_NODE &&
            (node.childNodes.length === 0 ||
              [...node.childNodes].every(
                (n) => n.nodeType === TEXT_NODE && n.textContent?.trim() === "",
              ));
        case "first-child":
          return (node, parent) => firstChild(node, parent);
        case "last-child":
          return (node, parent) => lastChild(node, parent);
        case "only-child":
          return (node, parent) => onlyChild(node, parent);
        case "nth-child":
          return (node, parent) => {
            const target = nthChildIndex(node, parent) + 1;
            if (Number.isNaN(Number(selector.argument))) {
              switch (selector.argument) {
                case "odd":
                  return Math.abs(target % 2) == 1;
                case "even":
                  return target % 2 === 0;
                default: {
                  if (!selector.argument) {
                    throw new Error(`Unsupported empty nth-child selector!`);
                  }
                  const nth = nthChild(selector.argument);
                  const elements = [...parent?.childNodes ?? []].filter(
                    (n: Node) => n.nodeType === ELEMENT_NODE,
                  );
                  const childIndex = nthChildIndex(node, parent) + 1;
                  for (let i = 0; i < elements.length; i++) {
                    const n = nth(i);
                    if (n > elements.length) return false;
                    if (n === childIndex) return true;
                  }
                  return false;
                }
              }
            }
            return target === Number(selector.argument);
          };
        default:
          throw new Error(`Unhandled pseudo-class: ${selector.name}!`);
      }
    }
    case "attribute":
      return (node: Node) => {
        let { caseSensitive, name, value } = selector;
        if (!node.attributes) return false;
        const attrs = Object.entries(node.attributes);
        for (const [attr, attrVal] of attrs) {
          if (caseSensitive === "i") {
            value = name.toLowerCase();
            attrVal.value = attr.toLowerCase();
          }
          if (attr !== name) continue;
          if (!value) return true;
          if (
            (value[0] === '"' || value[0] === "'") &&
            value[0] === value[value.length - 1]
          ) {
            value = JSON.parse(value);
          }
          if (value) {
            return getAttributeMatch(selector)(attrVal.value, value);
          }
        }
        return false;
      };
    case "universal":
      return (_: Node) => {
        return true;
      };
    default: {
      throw new Error(`Unhandled selector: ${selector.type}`);
    }
  }
};

const selectorToMatch = (sel: string | AST): Matcher => {
  const selector = typeof sel === "string" ? parse(sel) : sel;
  switch (selector?.type) {
    case "list": {
      const matchers = selector.list.map((s: any) => createMatch(s));
      return (node, parent, index) => {
        for (const match of matchers) {
          if (match(node, parent, index)) return true;
        }
        return false;
      };
    }
    case "compound": {
      const matchers = selector.list.map((s: any) => createMatch(s));
      return (node, parent, index) => {
        for (const match of matchers) {
          if (!match(node, parent, index)) return false;
        }
        return true;
      };
    }
    case "complex": {
      const { left, right, combinator } = selector;
      const matchLeft = selectorToMatch(left);
      const matchRight = selectorToMatch(right);
      const leftMatches = new WeakSet();
      return (node, parent, i = 0) => {
        if (matchLeft(node)) {
          leftMatches.add(node);
        } else if (parent && leftMatches.has(parent) && combinator === " ") {
          leftMatches.add(node);
        }
        if (!matchRight(node)) return false;
        switch (combinator) {
          case " ": // fall-through
          case ">":
            return parent ? leftMatches.has(parent) : false;
          case "~": {
            if (!parent) return false;
            for (const sibling of [...parent.childNodes].slice(0, i)) {
              if (leftMatches.has(sibling)) return true;
            }
            return false;
          }
          case "+": {
            if (!parent) return false;
            const prevSiblings = [...parent.childNodes]
              .slice(0, i)
              .filter((el: Node) => el.nodeType === ELEMENT_NODE);
            if (prevSiblings.length === 0) return false;
            const prev = prevSiblings[prevSiblings.length - 1];
            if (!prev) return false;
            if (leftMatches.has(prev)) return true;
          }
          default:
            return false;
        }
      };
    }
    default:
      return createMatch(selector!) as Matcher;
  }
};
