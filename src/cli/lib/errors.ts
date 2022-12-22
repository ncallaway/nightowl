import { Result } from "neverthrow";
import { OwlError, OwlErrorKey } from "../../core/errors";

export type ErrorHandler = {
  message: string;
  exitCode: number;
}


export const Errors: Record<OwlErrorKey, ErrorHandler> = {
  'err-store-not-found': { message: ".owl directory was not found. Have you run owl init?", exitCode: 2 },
  'err-store-not-recognized': { message: "The .owl directory structure was not recognized.", exitCode: 3 },
  'err-store-already-exists': { message: "The .owl directory already exists.", exitCode: 4 },
  'err-store-initialization': { message: "Something went wrong when initalizing the store", exitCode: 5}
}

export const unwrap = <T,>(res: Result<T, OwlError>): T => {
  if (res.isErr()) {
    return errorDie(res.error);
  }

  return res.value;
}

export const errorDie = (err: OwlError): never => {
  const handler = Errors[err.error];

  const message = handler.message;

  console.error(`\n${message}`);
  console.error(`\nFor more information run: owl help ${err.error}`);

  if (err.detail && Object.prototype.toString.call(err.detail) === "[object String]") {
    console.error(`\nError Detail: ${err.detail}`);
  }

  if (err.detail && err.detail instanceof Error) {
    console.error(`\nError Detail: ${err.detail.message}`);
  }

  process.exit(handler.exitCode);

}