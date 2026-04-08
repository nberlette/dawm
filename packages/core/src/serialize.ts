import {
  isObject,
  ObjectHasOwn,
  RegExpPrototypeTest,
  SetPrototypeHas,
  StringPrototypeReplace,
  StringPrototypeStartsWith,
  StringPrototypeToLowerCase,
  StringPrototypeTrim,
  SymbolIterator,
} from "dawm-internal";
import type { NamedNodeMap } from "dawm-core/collections/named-node-map";
import type { DOMStringMap } from "dawm-core/collections/dom-string-map";
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
} from "dawm-core";
import { isNodeLike, NodeType } from "dawm-core/types";

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

const RAW_TEXT_ELEMENTS = new Set([
  "script",
  "style",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "plaintext",
]);

const BOOLEAN_ATTRIBUTES = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
  "typemustmatch",
]);

export function escapeHTML(html: string): string {
  const entities: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;",
    '"': "&quot;",
    "&": "&amp;",
  };

  html = (html || "") + "";
  return StringPrototypeReplace(html, /[<>'"&]/g, (m) => entities[m] || m);
}

export function unescapeHTML(html: string): string {
  const entities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&quot;": '"',
    "&amp;": "&",
  };

  html = (html || "") + "";
  return StringPrototypeReplace(
    html,
    /(&([gl]t|apos|amp|quot);)/g,
    (m) => entities[m] || m,
  );
}

function escapeAttributeValue(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    '"': "&quot;",
    "<": "&lt;",
  };
  return StringPrototypeReplace(value, /[&"<]/g, (m) => entities[m] || m);
}

function escapeTextData(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
  };
  return StringPrototypeReplace(value, /[&<]/g, (m) => entities[m] || m);
}

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
 * ensuring a complete HTML representation. Void elements are serialized without
 * end tags, matching the HTML serialization algorithm rather than XHTML.
 *
 * Attributes and `dataset` properties of elements are also serialized per HTML
 * conventions, formatted as `name="value"` and `data-*="value"` entries,
 * respectively. Attribute values are escaped, boolean attributes are minimized,
 * and text nodes are escaped except in raw text elements like `script` and
 * `style`.
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
    if (isNodeLike(node)) {
      switch (node.nodeType) {
        case NodeType.Element: {
          let out = "";
          let prefix = node.prefix;
          if (!prefix && node.namespaceURI) {
            prefix = node.lookupPrefix(node.namespaceURI);
          }
          prefix = prefix ? prefix + ":" : "";
          const local = node.localName;
          const qname = `${prefix}${local}`;
          out += `<${qname}`;
          const attributes = node.attributes;
          if (attributes) {
            out += serializeNamedNodeMap(attributes) || "";
          }
          if (node.isSelfClosing) return out + " />";
          out += ">";
          let child = node.firstChild;
          if (!child && node.textContent) {
            out += escapeTextData(node.textContent);
          } else {
            while (child) {
              out += serializeHTML(child);
              child = child.nextSibling;
            }
          }
          return `${out}</${qname}>`;
        }
        case NodeType.Attribute:
          if (node.specified) {
            return serializeAttribute(node.name, node.value);
          } else {
            return "";
          }
        case NodeType.Text:
          if (!node.textContent) return "";
          if (
            node.parentElement &&
            SetPrototypeHas(RAW_TEXT_ELEMENTS, node.parentElement.localName)
          ) {
            return node.textContent;
          }
          return escapeTextData(node.textContent);
        case NodeType.CDATASection:
          return `<![CDATA[${node.data}]]>`;
        case NodeType.ProcessingInstruction:
          return `<?${node.target} ${node.data}?>`;
        case NodeType.Comment:
          return `<!--${node.textContent || " "}-->`;
        case NodeType.DocumentFragment: {
          // TODO: identify and properly handle declarative ShadowRoots, which are DocumentFragments under the hood.
          let html = "", next = node.firstChild;
          while (next) {
            html += serializeHTML(next);
            next = next.nextSibling;
          }
          return html;
        }
        case NodeType.DocumentType: {
          let out = "";
          out += `<!DOCTYPE ${node.name}`;
          if (node.publicId) {
            out += ` PUBLIC "${node.publicId}"`;
            if (node.systemId) out += ` "${node.systemId}"`;
          } else if (node.systemId) {
            out += ` SYSTEM "${node.systemId}"`;
          } else if (node.internalSubset) {
            out += ` [${node.internalSubset}]`;
          }

          return out + ">";
        }
        case NodeType.Document: {
          let out = "";
          if (node.doctype) out += serializeHTML(node.doctype);
          if (node.documentElement) out += serializeHTML(node.documentElement);
          return out;
        }
        default:
          return ""; // gracefully ignore unknown node types
      }
    } else if ("length" in node) {
      let out = "";
      for (let i = 0; i < node.length; i++) {
        if (node[i]) out += serializeHTML(node[i]);
      }
      return out;
    } else if (SymbolIterator in node) {
      let out = "";
      for (const child of node) out += serializeHTML(child);
      return out;
    }
  } else if (node == null) {
    return "";
  }

  const type = typeof node;
  const n = RegExpPrototypeTest(/^[aeiouy]/, type) ? "n" : "";
  throw new TypeError(
    `Cannot serialize unknown input type. Expected a Node instance, or an ` +
      `array-like/iterable collection of Nodes. Found a${n} ${type}: ${node}`,
  );
}

/**
 * Serializes a {@linkcode DOMStringMap} into a string of HTML data attributes.
 *
 * @param dataset - The DOMStringMap to serialize.
 * @returns A string representation of the DOMStringMap as HTML data
 * attributes.
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
    if (k == null || v == null) continue;

    // normalize attribute names from camelCase to kebab-case, where needed.
    if (StringPrototypeStartsWith(k, "aria")) {
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
      // ensure we handle some of the odd special cases for attribute names.

      // svg stuff
      if (kebab === "preserve-aspect-ratio") k = "preserveAspectRatio";
      else if (kebab === "xlink-href") k = "xlink:href";
      else if (kebab === "xml-space") k = "xml:space";
      // regular html stuff
      else if (kebab === "classname" || kebab === "class-name") k = "class";
      // aria attributes should be kebab-case
      else if (
        !StringPrototypeStartsWith(kebab, "aria-") &&
        !StringPrototypeStartsWith(kebab, "data-")
      ) k = kebab;
    }
    let prefix = "";
    if (attr.namespaceURI) {
      prefix = attr.lookupPrefix(attr.namespaceURI) ?? "";
      prefix &&= prefix + ":";
    }
    out += serializeAttribute(k, v, " " + prefix);
  }
  return out;
}

function serializeAttribute(
  name: string,
  value: string | number | boolean | null | undefined,
  prefix = "",
): string {
  if (value == null) return "";
  const rawValue = String(value);
  if (SetPrototypeHas(BOOLEAN_ATTRIBUTES, StringPrototypeToLowerCase(name))) {
    if (rawValue === "true" || rawValue === "") {
      return `${prefix}${name}`;
    }
  }
  return `${prefix}${name}="${escapeAttributeValue(rawValue)}"`;
}
