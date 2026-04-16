{{generated_marker}}

# `{{pkg.name}}`

{{pkg.description}}

## Overview

`{{pkg.name}}` is a workspace package in the dawm monorepo.

- Package: `{{pkg.name}}`
- Directory: `{{pkg.directory}}`
- Homepage: {{pkg.homepage}}
- Source: {{pkg.sourceUrl}}
- Issues: {{pkg.bugs.url}}
- License: MIT

## Usage

```ts
import * as mod from "{{pkg.name}}";

console.log(Object.keys(mod));
```

## Entry Points

{{pkg.exports}}

## Notes

{{pkg.notes}}

## Acknowledgements

{{pkg.acknowledgements}}

## Links

- GitHub: {{pkg.footerLinks.github}}
- Issues: {{pkg.footerLinks.issues}}
- Docs: {{pkg.footerLinks.docs}}
- npm: {{pkg.footerLinks.npm}}

## Development

This README is generated from the monorepo templates via `deno task sync:packages --apply`.
