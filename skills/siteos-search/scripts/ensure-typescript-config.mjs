#!/usr/bin/env node

import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const preservedCompilerOptions = ["baseUrl", "jsx", "paths"];

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonObject(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed;
}

export async function ensureTypeScriptConfig({ projectRoot = process.cwd() } = {}) {
  const root = path.resolve(projectRoot);
  const tsconfigPath = path.join(root, "tsconfig.json");
  if (await fileExists(tsconfigPath)) {
    return { status: "existing-tsconfig", tsconfigPath };
  }

  const jsconfigPath = path.join(root, "jsconfig.json");
  if (!(await fileExists(jsconfigPath))) {
    return { status: "no-jsconfig", tsconfigPath };
  }

  const jsconfig = await readJsonObject(jsconfigPath, "jsconfig.json");
  const sourceOptions = jsconfig.compilerOptions;
  const compilerOptions = {};
  if (sourceOptions && typeof sourceOptions === "object" && !Array.isArray(sourceOptions)) {
    for (const key of preservedCompilerOptions) {
      if (sourceOptions[key] !== undefined) {
        compilerOptions[key] = sourceOptions[key];
      }
    }
  }

  await writeFile(
    tsconfigPath,
    `${JSON.stringify({ compilerOptions }, null, 2)}\n`,
    "utf8",
  );
  return { status: "created-from-jsconfig", tsconfigPath };
}

function readProjectRoot(argv) {
  const index = argv.indexOf("--project-root");
  if (index === -1) {
    return process.cwd();
  }
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("--project-root requires a path.");
  }
  return value;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await ensureTypeScriptConfig({
      projectRoot: readProjectRoot(process.argv.slice(2)),
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
