import { ok, err, Result } from "neverthrow";
import { convert as insomniaConvert } from 'insomnia-importers'
import { OwlError } from "../errors";
import { RequestDefinition } from "../schemas/requestSchema";


export const convert = async (importStr: string): Promise<Result<RequestDefinition, OwlError>> => {
  try {
    const insomniaResult = await insomniaConvert(importStr);
    if (insomniaResult?.data?.resources && insomniaResult.data.resources.length > 0) {
      const definition = insomniaResult.data.resources[0] as RequestDefinition;
      return ok(definition);
    }
  } catch (error) {
    return err({ error: "err-unrecognized-request-import", detail: error as Error});
  }

  return err({ error: "err-unrecognized-request-import"});
}