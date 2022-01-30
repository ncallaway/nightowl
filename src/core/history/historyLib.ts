import { Result, ok } from "neverthrow";
import { ResponsePatch } from "../insomniaTypes";
import { dbstore } from "../store/dbstore";
import { OwlStore } from "../types";

const getRequests = async (owlstore: OwlStore): Promise<Result<ResponsePatch[], string>> => {
  const responses = await dbstore.getResponses(owlstore.db, 15);

  return ok(responses);
};

export const historyLib = {
  getRequests,
};
