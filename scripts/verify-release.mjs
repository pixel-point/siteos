#!/usr/bin/env node

import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const releaseRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

async function walkFiles(root) {
  const files = [];
  async function visit(directory) {
    const entries = await fsp.readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => comparePaths(left.name, right.name))) {
      if (directory === root && entry.name === ".git") continue;
      const absolutePath = path.join(directory, entry.name);
      const stat = await fsp.lstat(absolutePath);
      if (stat.isSymbolicLink()) throw new Error("release contains a symlink");
      if (stat.isDirectory()) await visit(absolutePath);
      else if (stat.isFile()) {
        files.push({
          absolutePath,
          mode: stat.mode & 0o111 ? "755" : "644",
          relativePath: path.relative(root, absolutePath).split(path.sep).join("/"),
        });
      } else {
        throw new Error("release contains an unsupported entry");
      }
    }
  }
  await visit(root);
  return files.sort((left, right) => comparePaths(left.relativePath, right.relativePath));
}

async function calculateArtifact(root) {
  const entries = (await walkFiles(root)).filter((entry) => entry.relativePath !== "release.json");
  const hash = crypto.createHash("sha256");
  for (const entry of entries) {
    hash.update(entry.relativePath);
    hash.update("\0");
    hash.update(entry.mode);
    hash.update("\0");
    hash.update(await fsp.readFile(entry.absolutePath));
    hash.update("\0");
  }
  return {
    algorithm: "sha256",
    digest: hash.digest("hex"),
    entries: entries.length,
    excludes: ["release.json"],
    format: "path-nul-mode-nul-content-nul-v1",
  };
}

try {
  const release = JSON.parse(await fsp.readFile(path.join(releaseRoot, "release.json"), "utf8"));
  const actual = await calculateArtifact(releaseRoot);
  if (JSON.stringify(release.artifact) !== JSON.stringify(actual)) {
    throw new Error("release artifact digest does not match the public tree");
  }
  process.stdout.write(`Verified SiteOS public release ${release.version}.\n`);
} catch (error) {
  process.stderr.write(
    `Release verification failed: ${error instanceof Error ? error.message : "invalid release"}.\n`,
  );
  process.exitCode = 1;
}
