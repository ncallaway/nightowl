import z from 'zod';

const joinErrors = (error: z.ZodError): string => {
  return flattenErrors(error).join("; ");
}

const flattenErrors = (error: z.ZodError): string[] => {
  return error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
}

export const zodUtil = {
  joinErrors,
  flattenErrors
}

