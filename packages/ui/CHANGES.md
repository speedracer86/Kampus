# Local changes to the design handoff

This package is the component library delivered from Claude Design ("Home schooling app design" handoff), kept as close to verbatim as possible. Divergences from the delivered files, and why:

- **Removed trailing `module.exports = {...}` lines from every `.jsx` file.** The files are ESM (they use `export function` throughout); the CommonJS lines were a gallery-bundling artifact and break ESM imports under Vite (`module` is undefined in the browser).

Everything else — styling, component behavior, the architecture contract in README.md — is untouched. Per the library's own rules: compose, don't restyle.
