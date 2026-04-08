/**
 * This module exposes the `@nick/dawm` library on the global scope. It is
 * primarily intended for use in environments where ES module imports are not
 * supported, such as traditional web browsers. By including this script via a
 * `<script>` tag, developers can access the `dawm` functionalities globally
 * without the need for module imports.
 *
 * @example
 * ```html
 * <script src="https://esm.sh/jsr/@nick/dawm/global.js?bundle"></script>
 * <script>
 *   const doc = dawm.parseFragment("<div>Hello, world!</div>", "body");
 *   console.log(doc.body.firstChild.textContent); // "Hello, world!"
 * </script>
 * ```
 * @module global
 */
// deno-lint-ignore-file no-var
import * as $dawm from "./index.ts";

declare global {
  export var dawm: dawm;
  export type dawm = typeof import("dawm");

  export var Node: typeof import("dawm-core").Node;
  export type Node = import("dawm-core").Node;
  export var Element: typeof import("dawm-core").Element;
  export type Element = import("dawm-core").Element;
  export var Attr: typeof import("dawm-core").Attr;
  export type Attr = import("dawm-core").Attr;
  export var CharacterData: typeof import("dawm-core").CharacterData;
  export type CharacterData = import("dawm-core").CharacterData;
  export var ProcessingInstruction:
    typeof import("dawm-core").ProcessingInstruction;
  export type ProcessingInstruction = import("dawm-core").ProcessingInstruction;
  export var CDATASection: typeof import("dawm-core").CDATASection;
  export type CDATASection = import("dawm-core").CDATASection;
  export var Text: typeof import("dawm-core").Text;
  export type Text = import("dawm-core").Text;
  export var Comment: typeof import("dawm-core").Comment;
  export type Comment = import("dawm-core").Comment;
  export var DocumentFragment: typeof import("dawm-core").DocumentFragment;
  export type DocumentFragment = import("dawm-core").DocumentFragment;
  export var DocumentType: typeof import("dawm-core").DocumentType;
  export type DocumentType = import("dawm-core").DocumentType;
  export var Document: typeof import("dawm-core").Document;
  export type Document = import("dawm-core").Document;
  export var TreeWalker: typeof import("dawm-core").TreeWalker;
  export type TreeWalker = import("dawm-core").TreeWalker;
  export var NodeIterator: typeof import("dawm-core").NodeIterator;
  export type NodeIterator = import("dawm-core").NodeIterator;
  export var AbstractRange: typeof import("dawm-core").AbstractRange;
  export type AbstractRange = import("dawm-core").AbstractRange;
  export var Range: typeof import("dawm-core").Range;
  export type Range = import("dawm-core").Range;
  export var StaticRange: typeof import("dawm-core").StaticRange;
  export type StaticRange = import("dawm-core").StaticRange;
  // export var DOMException: typeof import("dawm-core").DOMException;
  // export type DOMException = import("dawm-core").DOMException;
  export var DOMParser: typeof import("dawm-core").DOMParser;
  export type DOMParser = import("dawm-core").DOMParser;
  export var DOMImplementation: typeof import("dawm-core").DOMImplementation;
  export type DOMImplementation = import("dawm-core").DOMImplementation;
  export var DOMPoint: typeof import("dawm-core/geometry").DOMPoint;
  export type DOMPoint = import("dawm-core/geometry").DOMPoint;
  export var DOMPointReadOnly:
    typeof import("dawm-core/geometry").DOMPointReadOnly;
  export type DOMPointReadOnly = import("dawm-core/geometry").DOMPointReadOnly;
  export var DOMQuad: typeof import("dawm-core/geometry").DOMQuad;
  export type DOMQuad = import("dawm-core/geometry").DOMQuad;
  export var DOMRectReadOnly:
    typeof import("dawm-core/geometry").DOMRectReadOnly;
  export type DOMRectReadOnly = import("dawm-core/geometry").DOMRectReadOnly;
  export var DOMRect: typeof import("dawm-core/geometry").DOMRect;
  export type DOMRect = import("dawm-core/geometry").DOMRect;
  export var DOMMatrix: typeof import("dawm-core/geometry").DOMMatrix;
  export type DOMMatrix = import("dawm-core/geometry").DOMMatrix;
  export var DOMMatrixReadOnly:
    typeof import("dawm-core/geometry").DOMMatrixReadOnly;
  export type DOMMatrixReadOnly =
    import("dawm-core/geometry").DOMMatrixReadOnly;
  export var CSS: typeof import("dawm").CSS;
  export var CSSUnitValue: typeof import("dawm-css/unit-value").CSSUnitValue;
  export type CSSUnitValue = import("dawm-css/unit-value").CSSUnitValue;
  export var CSSStyleValue: typeof import("dawm-css/style-value").CSSStyleValue;
  export type CSSStyleValue = import("dawm-css/style-value").CSSStyleValue;
  export var CSSStyleDeclaration: typeof import("dawm-css").CSSStyleDeclaration;
  export type CSSStyleDeclaration = import("dawm-css").CSSStyleDeclaration;
  export var CSSStyleProperties: typeof import("dawm-css").CSSStyleProperties;
  export type CSSStyleProperties = import("dawm-css").CSSStyleProperties;
  export var CSSStyleSheet: typeof import("dawm-css").CSSStyleSheet;
  export type CSSStyleSheet = import("dawm-css").CSSStyleSheet;
  export var CSSRule: typeof import("dawm-css").CSSRule;
  export type CSSRule = import("dawm-css").CSSRule;
  export var CSSStyleRule: typeof import("dawm-css").CSSStyleRule;
  export type CSSStyleRule = import("dawm-css").CSSStyleRule;
  export var CSSImportRule: typeof import("dawm-css").CSSImportRule;
  export type CSSImportRule = import("dawm-css").CSSImportRule;
  export var CSSMediaRule: typeof import("dawm-css").CSSMediaRule;
  export type CSSMediaRule = import("dawm-css").CSSMediaRule;
  export var CSSFontFaceRule: typeof import("dawm-css").CSSFontFaceRule;
  export type CSSFontFaceRule = import("dawm-css").CSSFontFaceRule;
  export var CSSKeyframesRule: typeof import("dawm-css").CSSKeyframesRule;
  export type CSSKeyframesRule = import("dawm-css").CSSKeyframesRule;
  export var CSSKeyframeRule: typeof import("dawm-css").CSSKeyframeRule;
  export type CSSKeyframeRule = import("dawm-css").CSSKeyframeRule;
  export var CSSNamespaceRule: typeof import("dawm-css").CSSNamespaceRule;
  export type CSSNamespaceRule = import("dawm-css").CSSNamespaceRule;
  export var CSSSupportsRule: typeof import("dawm-css").CSSSupportsRule;
  export type CSSSupportsRule = import("dawm-css").CSSSupportsRule;
  export var CSSLayerBlockRule: typeof import("dawm-css").CSSLayerBlockRule;
  export type CSSLayerBlockRule = import("dawm-css").CSSLayerBlockRule;
  export var CSSLayerStatementRule:
    typeof import("dawm-css").CSSLayerStatementRule;
  export type CSSLayerStatementRule = import("dawm-css").CSSLayerStatementRule;
  export var CSSContainerRule: typeof import("dawm-css").CSSContainerRule;
  export type CSSContainerRule = import("dawm-css").CSSContainerRule;
  export var CSSPageRule: typeof import("dawm-css").CSSPageRule;
  export type CSSPageRule = import("dawm-css").CSSPageRule;
  export var CSSGroupingRule: typeof import("dawm-css").CSSGroupingRule;
  export type CSSGroupingRule = import("dawm-css").CSSGroupingRule;
  export var CSSConditionRule: typeof import("dawm-css").CSSConditionRule;
  export type CSSConditionRule = import("dawm-css").CSSConditionRule;
  export var CSSPropertyRule: typeof import("dawm-css").CSSPropertyRule;
  export type CSSPropertyRule = import("dawm-css").CSSPropertyRule;
  export var CSSScopeRule: typeof import("dawm-css").CSSScopeRule;
  export type CSSScopeRule = import("dawm-css").CSSScopeRule;
  export var CSSFontFeatureValuesRule:
    typeof import("dawm-css").CSSFontFeatureValuesRule;
  export type CSSFontFeatureValuesRule =
    import("dawm-css").CSSFontFeatureValuesRule;
  export var CSSFontPaletteValuesRule:
    typeof import("dawm-css").CSSFontPaletteValuesRule;
  export type CSSFontPaletteValuesRule =
    import("dawm-css").CSSFontPaletteValuesRule;
  export var CSSStartingStyleRule:
    typeof import("dawm-css").CSSStartingStyleRule;
  export type CSSStartingStyleRule = import("dawm-css").CSSStartingStyleRule;
  export var CSSFunctionRule: typeof import("dawm-css").CSSFunctionRule;
  export type CSSFunctionRule = import("dawm-css").CSSFunctionRule;
  export var CSSFunctionDeclarations:
    typeof import("dawm-css").CSSFunctionDeclarations;
  export type CSSFunctionDeclarations =
    import("dawm-css").CSSFunctionDeclarations;
  export var CSSFunctionDescriptors:
    typeof import("dawm-css").CSSFunctionDescriptors;
  export type CSSFunctionDescriptors =
    import("dawm-css").CSSFunctionDescriptors;
  export var CSSCounterStyleRule: typeof import("dawm-css").CSSCounterStyleRule;
  export type CSSCounterStyleRule = import("dawm-css").CSSCounterStyleRule;
  export var CSSCharsetRule: typeof import("dawm-css").CSSCharsetRule;
  export type CSSCharsetRule = import("dawm-css").CSSCharsetRule;
  export var CSSNumericValue: typeof import("dawm-css").CSSNumericValue;
  export type CSSNumericValue = import("dawm-css").CSSNumericValue;
  export var CSSNumericArray: typeof import("dawm-css").CSSNumericArray;
  export type CSSNumericArray = import("dawm-css").CSSNumericArray;
  export var CSSMathValue: typeof import("dawm-css").CSSMathValue;
  export type CSSMathValue = import("dawm-css").CSSMathValue;
  export var CSSMathSum: typeof import("dawm-css").CSSMathSum;
  export type CSSMathSum = import("dawm-css").CSSMathSum;
  export var CSSMathProduct: typeof import("dawm-css").CSSMathProduct;
  export type CSSMathProduct = import("dawm-css").CSSMathProduct;
  export var CSSMathNegate: typeof import("dawm-css").CSSMathNegate;
  export type CSSMathNegate = import("dawm-css").CSSMathNegate;
  export var CSSMathInvert: typeof import("dawm-css").CSSMathInvert;
  export type CSSMathInvert = import("dawm-css").CSSMathInvert;
  export var CSSMathMin: typeof import("dawm-css").CSSMathMin;
  export type CSSMathMin = import("dawm-css").CSSMathMin;
  export var CSSMathMax: typeof import("dawm-css").CSSMathMax;
  export type CSSMathMax = import("dawm-css").CSSMathMax;
  export var CSSMathClamp: typeof import("dawm-css").CSSMathClamp;
  export type CSSMathClamp = import("dawm-css").CSSMathClamp;
  export var CSSImageValue: typeof import("dawm-css").CSSImageValue;
  export type CSSImageValue = import("dawm-css").CSSImageValue;
  export var CSSKeywordValue: typeof import("dawm-css").CSSKeywordValue;
  export type CSSKeywordValue = import("dawm-css").CSSKeywordValue;
  export var CSSPositionValue: typeof import("dawm-css").CSSPositionValue;
  export type CSSPositionValue = import("dawm-css").CSSPositionValue;
  export var CSSPrimitiveValue: typeof import("dawm-css").CSSPrimitiveValue;
  export type CSSPrimitiveValue = import("dawm-css").CSSPrimitiveValue;
  export var CSSUnparsedValue: typeof import("dawm-css").CSSUnparsedValue;
  export type CSSUnparsedValue = import("dawm-css").CSSUnparsedValue;
  // export var CSSNestedDeclarations: typeof import("dawm-css").CSSNestedDeclarations;
  // export type CSSNestedDeclarations = import("dawm-css").CSSNestedDeclarations;
  export var StylePropertyMapReadOnly:
    typeof import("dawm-css").StylePropertyMapReadOnly;
  export type StylePropertyMapReadOnly =
    import("dawm-css").StylePropertyMapReadOnly;
  export var StylePropertyMap: typeof import("dawm-css").StylePropertyMap;
  export type StylePropertyMap = import("dawm-css").StylePropertyMap;
  export var Window: typeof import("dawm-view").Window;
  export type Window = import("dawm-view").Window;
  export var window: Window;
  export var Screen: typeof import("dawm-view").Screen;
  export type Screen = import("dawm-view").Screen;
  export var ScreenDetailed: typeof import("dawm-view").ScreenDetailed;
  export type ScreenDetailed = import("dawm-view").ScreenDetailed;
}

// @ts-ignore -- @nick/dawm global export
globalThis.dawm = $dawm;
