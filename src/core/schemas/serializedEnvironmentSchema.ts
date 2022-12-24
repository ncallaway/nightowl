import z from 'zod';
import { jsonSchema } from './jsonSchema';

/* eslint-disable @typescript-eslint/no-empty-interface */
const _privateSchema = z.object({
  key: z.string(),
  description: z.string().optional(),
}).array();

interface SerializedPrivateSchema extends z.infer<typeof _privateSchema> {}
const privateSchema: z.ZodType<SerializedPrivateSchema> = _privateSchema;


const _serializedEnvironmentSchema = z.object({
  values: jsonSchema.optional(),
  private: privateSchema.optional()
});
export interface SerializedEnvironment extends z.infer<typeof _serializedEnvironmentSchema> {}
export const serializedEnvironmentSchema: z.ZodType<SerializedEnvironment> = _serializedEnvironmentSchema;