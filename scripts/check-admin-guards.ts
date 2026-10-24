// Static guard for the admin area: `pnpm check:admin`.
// Pages, Route Handlers and Server Actions under src/app/admin each have to
// verify the admin role themselves (the proxy and the layout are not enough), so
// this fails the build when one forgets. It is a text check: it catches
// omissions, not deliberate bypasses. Behavior is covered by the manual matrix
// in the plan (anonymous / customer / admin against every route and action).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const adminDir = join(root, "src", "app", "admin");
const problems: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const rel = (path: string) => relative(root, path).split(sep).join("/");
const fail = (path: string, message: string) => problems.push(`${rel(path)}: ${message}`);

/** Index just past the bracket that closes the one opening at `open`. */
function closing(source: string, open: number) {
  const pairs: Record<string, string> = { "(": ")", "{": "}" };
  const opener = source[open];
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === opener) depth++;
    else if (source[i] === pairs[opener] && --depth === 0) return i + 1;
  }
  return -1;
}

/** Bodies of the exported functions matching `names`, with their export names. */
function exportedBodies(source: string, names: RegExp) {
  const found: { name: string; body: string }[] = [];
  const pattern = /export\s+(default\s+)?async\s+function\s*([A-Za-z0-9_]*)\s*\(/g;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    const name = match[1] ? "default" : match[2];
    if (!names.test(name)) continue;
    const argsEnd = closing(source, match.index + match[0].length - 1);
    const open = argsEnd < 0 ? -1 : source.indexOf("{", argsEnd);
    const end = open < 0 ? -1 : closing(source, open);
    if (end < 0) continue;
    found.push({ name, body: source.slice(open + 1, end - 1) });
  }
  return found;
}

// requireAdmin must run before anything else that awaits, so no work or data
// access happens for a caller who is not an admin. Reading route params is fine.
function checkGuardedFirst(path: string, name: string, body: string) {
  const call = body.search(/await\s+requireAdmin\s*\(/);
  if (call < 0) return fail(path, `${name} does not await requireAdmin()`);

  const before = body
    .slice(0, call)
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?:const|let)\s+[^;]*=\s*await\s+(?:params|searchParams)\s*;/g, "");
  // Only the `const { user } = ` that receives the result may come first.
  if (!/^\s*(?:(?:const|let)\s+[^;()]*=\s*)?$/.test(before)) {
    fail(path, `${name} does work before awaiting requireAdmin()`);
  }
}

const files = walk(adminDir);

for (const path of files) {
  const file = path.split(sep).pop()!;
  const source = readFileSync(path, "utf8");

  if (file === "loading.tsx" || file === "loading.ts") {
    fail(path, "loading files create a Suspense shell, so non-admins would get a 200 instead of a 404");
  }

  if (file === "page.tsx") {
    const pages = exportedBodies(source, /^default$/);
    if (pages.length === 0) fail(path, "has no async default export to check");
    // A layout's `false` does not exempt navigations between pages, so each page needs its own.
    if (!/export\s+const\s+instant\s*=\s*false\b/.test(source)) {
      fail(path, "must export `const instant = false` (blocking, so non-admins get a real 404)");
    }
    for (const { name, body } of pages) checkGuardedFirst(path, name, body);
  }

  if (file === "layout.tsx" || file === "page.tsx") {
    const code = source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    if (/<Suspense\b/.test(code)) {
      fail(path, "<Suspense> here would stream a 200 before the admin check can 404");
    }
  }

  if (file === "route.ts") {
    const handlers = exportedBodies(source, /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/);
    if (handlers.length === 0) fail(path, "has no async route handler to check");
    for (const { name, body } of handlers) checkGuardedFirst(path, name, body);
  }

  if (file === "actions.ts" || file === "actions.tsx") {
    if (!/^\s*(?:\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*["']use server["']/.test(source)) {
      fail(path, 'must start with "use server"');
    }
    const exportedNames = [...source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)];
    const guarded = exportedBodies(source, /./);
    for (const [, name] of exportedNames) {
      if (!guarded.some((g) => g.name === name)) {
        fail(path, `${name} must be an exported async function`);
      }
    }
    for (const { name, body } of guarded) checkGuardedFirst(path, name, body);
    // `export const x = ...` would be an unguarded entry point the loop above cannot see.
    if (/export\s+(?:const|let|var|default\s+(?!async\s+function))/.test(source)) {
      fail(path, "export only `async function` declarations from an actions file");
    }
  }
}

// Admin data access (admin-queries, admin-catalog) is only for admin pages and
// actions, which have already verified the role.
const allowedImporters = (path: string) =>
  rel(path).startsWith("src/app/admin/") || /^src\/lib\/admin-[^/]+\.ts$/.test(rel(path));
for (const path of walk(join(root, "src")).filter((p) => /\.(ts|tsx)$/.test(p))) {
  if (allowedImporters(path)) continue;
  if (/from\s+["'](?:@\/lib|\.{1,2}(?:\/[^"']*)?)\/admin-[^"']+["']/.test(readFileSync(path, "utf8"))) {
    fail(path, "imports admin data access from outside src/app/admin");
  }
}

if (problems.length > 0) {
  console.error(`Admin guard check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`Admin guard check passed (${files.length} files under src/app/admin).`);
