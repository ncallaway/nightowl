import { Result } from "neverthrow";
import { OwlError, OwlErrorKey } from "../../core/errors";
import { hasHelpFile } from "../commands/utility/helpCmd";

export type ErrorHandler = {
  message: string;
  exitCode: number;
}


export const Errors: Record<OwlErrorKey, ErrorHandler> = {
  'err-owldir-not-found': { message: "The owl directory was not found. Have you run owl init?", exitCode: 2 },
  'err-owldir-not-recognized': { message: "The owl directory structure was not recognized", exitCode: 3 },
  'err-owldir-already-exists': { message: "The owl directory already exists", exitCode: 4 },
  'err-writing-owldir': { message: "Something went wrong when initalizing the owl directory", exitCode: 5 },

  'err-request-def-already-exists': { message: "A request with the key::identifier:: already exists", exitCode: 6 },
  'err-request-def-not-found': {message: "The request definition was not found", exitCode: 20},
  'err-request-group-already-exists': { message: "A request group::identifier:: already exists", exitCode: 7 },
  'err-invalid-request-def': { message: "The request definition was not a valid request", exitCode: 8 },
  'err-writing-request-def': { message: "Something went wrong when writing the request to a file", exitCode: 9},

  'err-unrecognized-request-import': { message: "The request import format was not recognized", exitCode: 10 },

  'err-env-not-found': { message: "The environment was not found.", exitCode: 11 },
  'err-env-already-exists': { message: "An environment with that name already exists", exitCode: 12 },
  'err-reading-env': { message: "Something went wrong when reading the environment file", exitCode: 13 },
  'err-writing-env': { message: "Something went wrong when writing the environment file", exitCode: 14 },
  'err-invalid-env-name': { message: "The provided environment name was not valid.", exitCode: 15},
  'err-no-default-env': { message: "No default environment exists", exitCode: 16},

  'err-reading-env-config': {message: "Something went wrong when reading the environment config file", exitCode: 17},
  'err-writing-env-config': { message: "Something went wrong when writing to the environment config file", exitCode: 18 },

  'err-invalid-state-name': { message: "The provided state name was not valid.", exitCode: 19}
}

const unwrapSync = <T,>(res: Result<T, OwlError>): T => {
  if (res.isErr()) {
    return errorDie(res.error);
  }

  return res.value;
}

export function unwrap<T>(res: Result<T, OwlError>): T;
export function unwrap<T>(res: Promise<Result<T, OwlError>>): Promise<T>;
export function unwrap<T>(res: Result<T, OwlError> | Promise<Result<T, OwlError>>): T | Promise<T> {
  if (res instanceof Promise) {
    return res.then(value => unwrapSync(value));
  } else {
    return unwrapSync(res);
  }
}

export const errorDie = (err: OwlError): never => {
  const handler = Errors[err.error];
  let message = handler.message;
  const helpExists = hasHelpFile(err.error);

  const identifier = err.identifier ? ` (${err.identifier})` : "";

  const messageHasIdentifier = message.includes("::identifier::");
  if (messageHasIdentifier) {
    message = message.replace("::identifier::", identifier);
  } else {
    message += identifier;
  }

  console.error(`\n${message}.`);

  if (helpExists) {
    console.error(`\nFor more information run: owl help ${err.error}`);
  } else {
    console.error(`\nError code: ${err.error}`);
  }

  if (err.detail && Object.prototype.toString.call(err.detail) === "[object String]") {
    console.error(`\nError detail: ${err.detail}`);
  }

  if (err.detail && err.detail instanceof Error) {
    console.error(`\nError detail: ${err.detail.message}`);
  }

  process.exit(handler.exitCode);

}