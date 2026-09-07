import { z } from "zod";

type Field = {
  schema: z.ZodType;
  label: string;
  kind?: string;
  displayRole?: "primary" | "secondary";
};
// Project-owned helper: UI and host server share the schema; metadata follows its keys.
export function defineForm<const Fields extends Record<string, Field>>(input: {
  formKey: string;
  name: string;
  fields: Fields;
}) {
  const shape = Object.fromEntries(
    Object.entries(input.fields).map(([key, field]) => [key, field.schema]),
  ) as {
    [Key in keyof Fields]: Fields[Key]["schema"];
  };
  const schema = z.strictObject(shape);
  return {
    ...input,
    schema,
    definition() {
      const normalizedFieldsJson = Object.entries(input.fields).map(
        ([key, { schema: _schema, ...metadata }]) => {
          if (key !== key.trim())
            throw new Error("Field keys cannot contain surrounding whitespace.");
          return {
            key,
            ...metadata,
            label: metadata.label.trim(),
            ...(metadata.kind === undefined ? {} : { kind: metadata.kind.trim() }),
          };
        },
      );
      const primary = normalizedFieldsJson.filter((field) => field.displayRole === "primary");
      if (primary.length !== 1 || shape[primary[0]!.key]!.isOptional())
        throw new Error("Exactly one required primary field is needed.");
      return {
        formKey: input.formKey,
        name: input.name,
        schemaJson: z.toJSONSchema(schema, { target: "draft-07", io: "output" }),
        normalizedFieldsJson,
      };
    },
  };
}
