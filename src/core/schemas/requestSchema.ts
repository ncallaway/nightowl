import z from 'zod';
import { jsonSchema } from './jsonSchema';

/* eslint-disable @typescript-eslint/no-empty-interface */
const _requestHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
  disabled: z.boolean().optional(),
})
// this pattern is weird and bad, but it solves this problem: https://stackoverflow.com/questions/74068609/zod-show-inferred-nested-types-in-ide
interface RequestHeader extends z.infer<typeof _requestHeaderSchema> {}
const requestHeaderSchema: z.ZodType<RequestHeader> = _requestHeaderSchema;

const _requestParameterSchema = z.object({
  name: z.string(),
  value: z.string(),
  disabled: z.boolean().optional(),
  id: z.string().optional(),
  filename: z.string().optional(),
});
interface RequestParameter extends z.infer<typeof _requestParameterSchema> {}
const requestParameterSchema: z.ZodType<RequestParameter> = _requestParameterSchema;

const _requestPromptSchema = z.object({
  key: z.string(),
  description: z.string().optional(),
})
interface RequestPrompt extends z.infer<typeof _requestPromptSchema> {}
const requestPromptSchema: z.ZodType<RequestPrompt> = _requestPromptSchema;

const _requestBodyParameterSchema = z.object({
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
  disabled: z.boolean().optional(),
  multiline: z.string().optional(),
  id: z.string().optional(),
  fileName: z.string().optional(),
  type: z.string().optional()
})
interface RequestBodyParameter extends z.infer<typeof _requestBodyParameterSchema> {}
const requestBodyParameterSchema: z.ZodType<RequestBodyParameter> = _requestBodyParameterSchema;

const _requestBodySchema = z.object({
  mimeType: z.string().optional().nullable(),
  text: z.string().optional(),
  fileName: z.string().optional(),
  params: requestBodyParameterSchema.array().optional(),
  json: jsonSchema.optional()
});


interface RequestBody extends z.infer<typeof _requestBodySchema> {}
const requestBodySchema: z.ZodType<RequestBody> = _requestBodySchema;

// designed to closely match insomnia v4
export const _requestDefinitionSchema = z.object({
  url: z.string(),
  method: z.string().optional(),
  description: z.string().optional(),
  body: requestBodySchema.optional(),
  parameters: requestParameterSchema.array().optional(),
  headers: requestHeaderSchema.array().optional(),
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
  prompts: requestPromptSchema.array().optional()
});
export interface RequestDefinition extends z.infer<typeof _requestDefinitionSchema> {}
export const requestDefinitionSchema: z.ZodType<RequestDefinition> = _requestDefinitionSchema;