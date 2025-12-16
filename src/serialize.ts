import {
  isObject,
  JSONStringify,
  ObjectHasOwn,
  StringPrototypeReplace,
  StringPrototypeSlice,
  StringPrototypeToLowerCase,
  StringPrototypeTrim,
} from "./_internal.ts";
import type { DOMStringMap, NamedNodeMap } from "./collections.ts";
import type {
  Attr,
  CDATASection,
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  Node,
  ProcessingInstruction,
  Text,
} from "./dom.ts";
import { NodeType } from "./dom.ts";

type AnyNode =
  | Element
  | Attr
  | Text
  | CDATASection
  | ProcessingInstruction
  | Comment
  | DocumentFragment
  | DocumentType
  | Document;

/**
 * Serializes one or more DOM Nodes to an HTML string. Expects either a single
 * {@linkcode Node} instance, or an array-like or iterable collection of such
 * instances. This function supports all standard DOM Node types, including:
 *
 * - {@linkcode Element}
 * - {@linkcode Attr}
 * - {@linkcode Text}
 * - {@linkcode CDATASection}
 * - {@linkcode ProcessingInstruction}
 * - {@linkcode Comment}
 * - {@linkcode DocumentFragment}
 * - {@linkcode DocumentType}
 * - {@linkcode Document}
 *
 * This function recursively processes child nodes for elements and documents,
 * ensuring a complete HTML representation. Self-closing tags are handled as
 * per HTML syntax rules, and are closed with XHTML-style  `/>` delimiters.
 *
 * Attributes and `dataset` properties of elements are also serialized per HTML
 * conventions, formatted as `name="value"` and `data-*="value"` entries,
 * respectively.
 *
 * This function can be passed the structured output of a DOM parser function
 * such as the {@linkcode parseHTML} utility in this library to render the AST
 * back into a semantically-valid HTML string.
 *
 * @param node A Node or an array-like/iterable of Nodes to serialize.
 * @returns The serialized HTML string representing the provided Node(s).
 * @throws {TypeError} If the input is invalid or unsupported.
 */
export function serializeHTML<T extends AnyNode | Node>(
  node: T | ArrayLike<T> | Iterable<T>,
): string;
export function serializeHTML<T extends AnyNode>(
  node: T | ArrayLike<T> | Iterable<T>,
): string {
  if (isObject(node)) {
    if ("nodeType" in node) {
      switch (node.nodeType) {
        case NodeType.Element /* Node.ELEMENT_NODE */: {
          let out = "";
          out += `<${node.localName}`;
          const attributes = node.attributes;
          if (attributes) {
            out += serializeNamedNodeMap(attributes) || "";
          }
          if (node.isSelfClosing) return `${out} />`;
          out += ">";
          if (node.childNodes.length > 0) {
            for (let i = 0; i < node.childNodes.length; i++) {
              const child = node.childNodes[i];
              if (child) out += serializeHTML(child);
            }
          } else if (node.textContent) {
            out += node.textContent;
          }
          return `${out}</${node.localName}>`;
        }
        case NodeType.Attribute:
          if (node.specified) {
            return serializeAttribute(node.name, node.value);
          } else {
            return "";
          }
        case NodeType.Text:
          return node.textContent || "";
        case NodeType.CData:
          return `<![CDATA[${node.data}]]>`;
        case NodeType.ProcessingInstruction:
          return `<?${node.target} ${node.data}?>`;
        case NodeType.Comment:
          return `<!--${node.data}-->`;
        case NodeType.Document: {
          let out = "";
          if (node.doctype) out += serializeHTML(node.doctype);
          if (node.documentElement) out += serializeHTML(node.documentElement);
          return out;
        }
        case NodeType.DocumentType /* Node.DOCUMENT_TYPE_NODE */: {
          let out = "";
          out += `<!DOCTYPE ${node.name}`;
          if (node.publicId) {
            out += ` PUBLIC "${node.publicId}"`;
            if (node.systemId) out += ` "${node.systemId}"`;
          } else if (node.systemId) {
            out += ` SYSTEM "${node.systemId}"`;
          }
          if (node.internalSubset) {
            out += ` [${node.internalSubset}]`;
          }

          return out + ">";
        }
        case NodeType.DocumentFragment:
          return serializeHTML(node.childNodes);
        default:
          return ""; // gracefully ignore unknown node types
      }
    } else if ("length" in node) {
      let out = "";
      for (let i = 0; i < node.length; i++) {
        if (node[i]) out += serializeHTML(node[i]);
      }
      return out;
    } else if (Symbol.iterator in node) {
      let out = "";
      for (const child of node) out += serializeHTML(child);
      return out;
    }
  } else if (node == null) {
    return "";
  }
  throw new TypeError(
    `Cannot serialize unknown input type. Expected a Node or an array-like/iterable collection of Nodes, but received a ${typeof node}: ${node}`,
  );
}

/**
 * Serializes a {@linkcode DOMStringMap} into a string of HTML data attributes.
 *
 * @param dataset - The DOMStringMap to serialize.
 * @returns A string representation of the DOMStringMap as HTML data attributes.
 * @category Collections
 * @tags DOMStringMap, Serialization
 */
export function serializeDOMStringMap(dataset: DOMStringMap): string {
  let out = "";
  for (const k in dataset) {
    if (!ObjectHasOwn(dataset, k)) continue;
    const v = dataset[k];
    if (v == null) continue;
    let p = StringPrototypeReplace(
      k,
      /([a-z]|^)([A-Z](?![A-Z]))/g,
      (_, $1, $2) => `${$1}-${$2}`,
    );
    p = StringPrototypeToLowerCase(StringPrototypeTrim(p));
    out += serializeAttribute(`data-${p}`, v, " ");
  }
  return out;
}

/**
 * Serializes a {@linkcode NamedNodeMap} into a string of HTML attributes.
 *
 * @param attrs - The NamedNodeMap to serialize.
 * @returns A string representation of the NamedNodeMap as HTML attributes.
 * @category Collections
 * @tags NamedNodeMap, Serialization
 */
export function serializeNamedNodeMap(attrs: NamedNodeMap): string {
  let out = "";
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    if (!attr) continue;

    let { name: k, value: v } = attr;

    if (
      k === "children" || (
        !v &&
        (k === "style" || k === "class" || k === "className" || k === "id")
      )
    ) {
      continue;
    }
    if ((!v && v !== "") || v === "false") continue;
    // normalize attribute names from camelCase to kebab-case, where needed.
    if (k.startsWith("aria")) {
      k = StringPrototypeReplace(
        k,
        /^aria([A-Z]\w+)$/,
        (_, $1) => "aria-" + $1,
      );
      k = StringPrototypeToLowerCase(k);
    } else if (k === "className" || k === "classList" || k === "class") {
      k = "class"; // normalize className/class/classList attrs
    } else if (k === "htmlFor") {
      k = "for"; // normalize htmlFor/for attrs
    } else if (k === "httpEquiv") {
      k = "http-equiv"; // normalize httpEquiv/http-equiv attrs
    } else if (k === "tabIndex") {
      k = "tabindex"; // normalize tabIndex/tabindex attrs
    } else if (k === "readOnly") {
      k = "readonly"; // normalize readOnly/readonly attrs
    } else if (k === "maxLength") {
      k = "maxlength"; // normalize maxLength/maxlength attrs
    } else {
      const kebab = StringPrototypeToLowerCase(
        StringPrototypeReplace(
          k,
          /([a-z]|^)([A-Z](?![A-Z]))/g,
          (_, $1, $2) => `${$1}-${$2}`,
        ),
      );
      if (!kebab.startsWith("aria-") && !kebab.startsWith("data-")) {
        // aria attributes should be kebab-case
        k = kebab;
      }
    }
    out += serializeAttribute(k, v, " ");
  }
  return out;
}

function serializeAttribute(
  name: string,
  value: string | number | boolean | null | undefined,
  prefix = "",
): string {
  if ((value ??= null) !== null) value = JSONStringify(value);
  if (value === null || value === "false") return "";
  if (value === name || value === "true" || value === "") {
    return `${prefix}${name}`;
  }
  if (value[0] === '"' && value[value.length - 1] === '"') {
    value = StringPrototypeSlice(value, 1, -1);
  }
  return `${prefix}${name}="${value}"`;
}
