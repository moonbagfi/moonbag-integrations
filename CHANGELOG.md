# Changelog

All notable changes to `moonbag-integrations` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned
- `GET /treasury` in the client once the endpoint ships
- Embeddable buy widget

## [0.1.0] - 2026-09-26

### Added
- `ENDPOINTS.md`: envelope, units, rate limits and every public endpoint
  (`/rounds`, `/rounds/{id}`, `/quote`, `/positions`, `/settlements`, `/burns`, `/board`, `/paper`)
- `@moonbagfi/sdk` 0.1.0: `MoonbagClient`, `MoonbagApiError`, payoff helpers, the write ABI and
  typed responses
- `examples/basic-usage.ts`
