import type { Maybe, Stringifiable } from "dawm-internal/types";

export { NodeType, QuirksMode, type QuirksModeType } from "dawm-core";

export type booleanish = Maybe<Stringifiable<boolean> & {} | "">;

export type numberish = Maybe<Stringifiable<number> & {}>;
