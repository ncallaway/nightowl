import z from 'zod';
import { jsonSchema } from './jsonSchema';

/* eslint-disable @typescript-eslint/no-empty-interface */
const _serializedRequestHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
  disabled: z.boolean().optional(),
})
interface SerializedRequestHeader extends z.infer<typeof _serializedRequestHeaderSchema> {}
const serializedRequestHeaderSchema: z.ZodType<SerializedRequestHeader> = _serializedRequestHeaderSchema;

const _serializedRequestParameterSchema = z.object({
  name: z.string(),
  value: z.string(),
  disabled: z.boolean().optional(),
  id: z.string().optional(),
  filename: z.string().optional(),
});
interface SerializedRequestParameter extends z.infer<typeof _serializedRequestParameterSchema> {}
const serializedRequestParameterSchema: z.ZodType<SerializedRequestParameter> = _serializedRequestParameterSchema;

const _serializedRequestPromptSchema = z.object({
  key: z.string(),
  description: z.string().optional(),
})
interface SerializedRequestPrompt extends z.infer<typeof _serializedRequestPromptSchema> {}
const serializedRequestPromptSchema: z.ZodType<SerializedRequestPrompt> = _serializedRequestPromptSchema;

const _serializedRequestBodyParameterSchema = z.object({
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
  disabled: z.boolean().optional(),
  multiline: z.string().optional(),
  id: z.string().optional(),
  fileName: z.string().optional(),
  type: z.string().optional()
})
interface SerializedRequestBodyParameter extends z.infer<typeof _serializedRequestBodyParameterSchema> {}
const serializedRequestBodyParameterSchema: z.ZodType<SerializedRequestBodyParameter> = _serializedRequestBodyParameterSchema;

const _serializedRequestBodySchema = z.object({
  mimeType: z.string().optional().nullable(),
  text: z.string().optional(),
  fileName: z.string().optional(),
  params: serializedRequestBodyParameterSchema.array().optional(),
  json: jsonSchema.optional()
});

// this pattern is bad, but it solves this problem: https://stackoverflow.com/questions/74068609/zod-show-inferred-nested-types-in-ide
interface SerializedRequestBody extends z.infer<typeof _serializedRequestBodySchema> {}
const serializedRequestBodySchema: z.ZodType<SerializedRequestBody> = _serializedRequestBodySchema;

// designed to closely match insomnia v4
export const _serializedRequestDefinitionSchema = z.object({
  url: z.string(),
  method: z.string().optional(),
  description: z.string().optional(),
  body: serializedRequestBodySchema.optional(),
  parameters: serializedRequestParameterSchema.array().optional(),
  headers: serializedRequestHeaderSchema.array().optional(),
  authentication: z.record(z.any()).optional(),
  metaSortKey: z.number().int().optional(),
  isPrivate: z.boolean().optional(),
  // settings
  settingStoreCookies: z.boolean().optional(),
  settingSendCookies: z.boolean().optional(),
  settingDisableRenderRequestBody: z.boolean().optional(),
  settingEncodeUrl: z.boolean().optional(),
  settingRebuildPath: z.boolean().optional(),
  settingFollowRedirects: z.enum(["on", "off", "global"]).optional(),

  // nightowl additions
  prompts: serializedRequestPromptSchema.array().optional()
});
export interface SerializedRequestDefinition extends z.infer<typeof _serializedRequestDefinitionSchema> {}
export const serializedRequestDefinitionSchema: z.ZodType<SerializedRequestDefinition> = _serializedRequestDefinitionSchema;