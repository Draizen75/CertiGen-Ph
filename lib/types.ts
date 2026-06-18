import { z } from "zod";

export const RecipientSchema = z.record(z.string(), z.string().or(z.number()).or(z.null()).transform(v => v?.toString() ?? ""));

export type Recipient = z.infer<typeof RecipientSchema>;

export const TemplatePlaceholderSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type TemplatePlaceholder = z.infer<typeof TemplatePlaceholderSchema>;

export const OutputModeSchema = z.enum(["COMBINED_DOCX", "SEPARATE_DOCX"]);
export type OutputMode = z.infer<typeof OutputModeSchema>;

export const CertConfigSchema = z.object({
  templateFile: z.instanceof(File).optional(),
  recipients: z.array(RecipientSchema),
  placeholderMapping: z.record(z.string(), z.string()), // Mapping: Placeholder -> Data Column
  outputMode: OutputModeSchema.default("COMBINED_DOCX"),
});

export type CertConfig = z.infer<typeof CertConfigSchema>;
