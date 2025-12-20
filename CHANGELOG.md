# Changelog

All notable changes to the [`dawm`] project will be documented in this file.

> The format of this changelog follows the guidelines from [Keep a Changelog].
> The [`dawm`] project follows the [Semantic Versioning] specification v2.0.0.
> Commits are typically structured per the [Conventional Commits] standard,
> allowing this changelog to be generated automatically on each release.

## [Unreleased]

### Housekeeping

- [`6cda816`]: update publish config in deno.json – [@nberlette]
- [`49c6146`]: update .gitignore – [@nberlette]

## [0.1.0-rc.2] - 2025-12-16

### Features

- [`2e666d3`]: add automated npm build script – [@nberlette]
- [`4caf388`]: add automated version bump script – [@nberlette]

### Bug Fixes

- [`fe977d4`]: remove broken doc include attributes – [@nberlette]

### Housekeeping

- [`eaa598f`]: update serialization example – [@nberlette]

## [0.1.0-rc.1] - 2025-12-15

### Features

- [`6bcee91`]: implement living collections – [@nberlette]

### Refactors

- [`1724d83`]: consolidate all serializers into a single module – [@nberlette]
- [`250b420`]: drop dynamic import from global.ts – [@nberlette]

### Dependencies

- [`3fb84f9`]: use the latest wasm-bindgen and js-sys versions – [@nberlette]

---

[MIT] © [Nicholas Berlette]. All rights reserved.

[MIT]: https://nick.mit-license.org/2025 "MIT License"
[Nicholas Berlette]: https://github.com/nberlette "Follow @nberlette on GitHub for more cool projects!"
[`dawm`]: https://github.com/nberlette/dawm/#readme "Star nberlette/dawm on GitHub! ⭐️"
[Keep a Changelog]: https://keepachangelog.com/en/1.0.0/ "Keep a Changelog v1.0.0"
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html "Semantic Versioning v2.0.0"
[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/ "Conventional Commits v1.0.0"

<!--[references:versions]-->

[Unreleased]: https://github.com/nberlette/dawm/compare/0.1.0-rc.2..HEAD
[0.1.0-rc.2]: https://github.com/nberlette/dawm/releases/tag/0.1.0-rc.2
[0.1.0-rc.1]: https://github.com/nberlette/dawm/releases/tag/0.1.0-rc.1

<!--[/references:versions]-->

<!--[references:authors]-->

[@nberlette]: https://github.com/nberlette "Nicholas Berlette on GitHub"

<!--[/references:authors]-->

<!--[references:commits]-->

[`6cda816`]: https://github.com/nberlette/dawm/commit/6cda816
[`49c6146`]: https://github.com/nberlette/dawm/commit/49c6146
[`6bcee91`]: https://github.com/nberlette/dawm/commit/6bcee91
[`2e666d3`]: https://github.com/nberlette/dawm/commit/2e666d3
[`4caf388`]: https://github.com/nberlette/dawm/commit/4caf388
[`3fb84f9`]: https://github.com/nberlette/dawm/commit/3fb84f9
[`eaa598f`]: https://github.com/nberlette/dawm/commit/eaa598f
[`1724d83`]: https://github.com/nberlette/dawm/commit/1724d83
[`250b420`]: https://github.com/nberlette/dawm/commit/250b420
[`fe977d4`]: https://github.com/nberlette/dawm/commit/fe977d4

<!--[/references:commits]-->
