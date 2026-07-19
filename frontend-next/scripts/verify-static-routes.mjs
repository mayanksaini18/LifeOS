#!/usr/bin/env node
// Fails `npm test` if any route that must be statically prerendered (`○` in
// `next build`'s route table) is not, e.g. because it was moved back under a
// layout that forces dynamic rendering (a `cookies()`/`getSession()` call in
// an ancestor layout, `export const dynamic = "force-dynamic"`, etc).
//
// Reads `.next/prerender-manifest.json` — Next only lists a path under its
// top-level `routes` key when it was actually prerendered to static HTML at
// build time. Dynamic (`ƒ`) routes never appear there (confirmed: neither in
// `routes` nor in `dynamicRoutes`, which is reserved for ISR fallback params),
// so membership in `routes` is a reliable, structured proxy for `○` vs `ƒ`
// that doesn't depend on parsing `next build`'s human-readable stdout table.
//
// Run after `next build` and before the Storybook/vitest suite, which cannot
// observe this class of regression (it never runs Next's server/RSC build).

import { readFileSync } from "node:fs";
import path from "node:path";

const REQUIRED_STATIC_ROUTES = ["/welcome"];

const manifestPath = path.join(process.cwd(), ".next", "prerender-manifest.json");

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (err) {
  console.error(
    `verify-static-routes: could not read ${manifestPath} (${err.message}). ` +
      "This script must run after `next build`.",
  );
  process.exit(1);
}

const staticRoutes = new Set(Object.keys(manifest.routes ?? {}));
const missing = REQUIRED_STATIC_ROUTES.filter((route) => !staticRoutes.has(route));

if (missing.length > 0) {
  console.error(
    "verify-static-routes: expected the following route(s) to be statically " +
      `prerendered ("○" in \`next build\`'s route table) but they were not ` +
      `found in .next/prerender-manifest.json's "routes": ${missing.join(", ")}\n` +
      "This usually means the route now depends on something that forces " +
      "dynamic rendering — e.g. it was moved back under a route group whose " +
      "layout calls cookies()/getSession(), or gained `export const dynamic " +
      '= "force-dynamic"`.',
  );
  process.exit(1);
}

console.log(`verify-static-routes: OK — statically prerendered: ${REQUIRED_STATIC_ROUTES.join(", ")}`);
