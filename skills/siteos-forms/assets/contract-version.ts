import { createHash } from "node:crypto";

// Versioned serialization: sort object keys, preserve array order, hash UTF-8 JSON.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function formsContractVersion(definition: {
  schemaJson: Record<string, unknown>;
  normalizedFieldsJson: unknown;
}): string {
  return `sha256:${createHash("sha256")
    .update(
      canonical(
        JSON.parse(
          JSON.stringify({
            schemaJson: definition.schemaJson,
            normalizedFieldsJson: definition.normalizedFieldsJson,
          }),
        ),
      ),
    )
    .digest("hex")}`;
}
