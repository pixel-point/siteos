#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? argv[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }
    args.set(key, value);
  }
  return args;
}

function usage() {
  return "Usage: node scripts/serve-report.mjs --root <report-dir> [--port 0]";
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "text/plain; charset=utf-8";
}

async function resolveSafePath(root, requestUrl) {
  const url = new URL(requestUrl ?? "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname);
  const candidate = path.resolve(
    root,
    pathname === "/" ? "index.html" : pathname.slice(1),
  );
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return candidate;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.get("root");
  const port = Number.parseInt(args.get("port") ?? "0", 10);

  if (!root) {
    console.error(usage());
    process.exit(1);
  }

  const resolvedRoot = path.resolve(root);
  const rootStat = await stat(resolvedRoot);
  if (!rootStat.isDirectory()) {
    throw new Error("--root must point to a report directory.");
  }
  const indexStat = await stat(path.join(resolvedRoot, "index.html"));
  if (!indexStat.isFile()) {
    throw new Error("--root must contain an index.html report.");
  }

  const server = createServer(async (request, response) => {
    const filePath = await resolveSafePath(resolvedRoot, request.url);
    if (!filePath) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new Error("Not a file");
      }
      response.writeHead(200, { "content-type": contentType(filePath) });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  server.listen(Number.isFinite(port) ? port : 0, "127.0.0.1", () => {
    const address = server.address();
    if (address && typeof address !== "string") {
      console.log(
        `SiteOS search report server: http://127.0.0.1:${address.port}/`,
      );
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
