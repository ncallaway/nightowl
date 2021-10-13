import { err, ok } from "neverthrow";
import { env } from "../../../src/core";
import { files } from "../../../src/core/lib/files";
import { mockedFn } from "../../util";

jest.mock("../../../src/core/lib/files");

const mockReadJson = mockedFn(files.readJson);
describe("env", () => {
  describe("get", () => {
    it("should read the file successfully", async () => {
      mockReadJson.mockImplementation(() => Promise.resolve(ok({ hey: "this worked!" })));

      const res = await env.get("qa");
      expect(res).toEqual(ok({ hey: "this worked!" }));

      expect(mockReadJson.call.length).toBe(1);
      expect(mockReadJson.mock.calls[0][0]).toEqual(".owl/.env/qa.json");
    });

    it("should return an error if the env doesn't exist", async () => {
      mockReadJson.mockImplementation(() => Promise.resolve(err("file not found")));

      const res = await env.get("qa");
      expect(res).toEqual(err("file not found"));
    });
  });
});
