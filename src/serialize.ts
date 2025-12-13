import { isObject } from "./_internal.ts";
import { serializeDOMStringMap, serializeNamedNodeMap } from "./collections.ts";
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
          out += serializeNamedNodeMap(attributes) || "";
          if (node.dataset) {
            out += serializeDOMStringMap(node.dataset) || "";
          }
          if (node.isSelfClosing) return `${out} />`;
          out += ">";
          if (node.childNodes.length > 0) {
            out += serializeHTML(node.childNodes);
          } else if (node.textContent) {
            out += node.textContent;
          }
          return `${out}</${node.localName}>`;
        }
        case NodeType.Attribute:
          if (node.specified) {
            return `${node.name}="${node.value}"`;
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
        case NodeType.Document:
          if (node.documentElement) return serializeHTML(node.documentElement);
          return "";
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
    } else if ("length" in node || Symbol.iterator in node) {
      let out = "";
      const nodes = Array.from(node);
      for (let i = 0; i < nodes.length; i++) {
        out += serializeHTML(nodes[i]);
      }
      return out;
    }
  }
  throw new TypeError(
    `Cannot serialize unknown input type. Expected a Node or an array-like/iterable collection of Nodes, but received a ${typeof node}: ${node}`,
  );
}
