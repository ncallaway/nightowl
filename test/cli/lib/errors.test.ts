import { Errors } from "../../../src/cli/lib/errors";
import { OwlErrorKey } from "../../../src/core/errors";

describe("Errors", () => {
  it("should have unique exit codes", () => {
    const exitCodes: Record<number, OwlErrorKey[]> = {};

    Object.keys(Errors).forEach((key: string) => {
      const k = key as OwlErrorKey;
      const code = Errors[k].exitCode;

      if (exitCodes[code] !== undefined) {
        exitCodes[code].push(k);
      } else {
        exitCodes[code] = [k];
      }
    });

    Object.keys(exitCodes).forEach(code => {
      const errorKeysForCode: OwlErrorKey[] = exitCodes[code];
      if (errorKeysForCode.length != 1) {
        console.error(`Error keys ${errorKeysForCode.join(", ")} all share exit code: ${code}`);
      }
      expect(errorKeysForCode.length).toEqual(1);
    })
  });
});
