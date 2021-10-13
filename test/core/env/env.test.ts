import { env } from "../../../src/core";
import { listSummary, EnvironmentSummary } from "../../../src/core/env/envListSummary";

jest.mock("../../../src/core/env/envListSummary");

const mockedFn = <T extends (...args: any[]) => any>(thing: T): jest.MockedFunction<T> => {
  return thing as unknown as jest.MockedFunction<T>;
};

describe("env", () => {
  describe("exists", () => {
    const stubEnvironments: EnvironmentSummary[] = [{ name: "dev" }, { name: "staging" }];
    const mockList = mockedFn(listSummary).mockImplementation(() => Promise.resolve(stubEnvironments));
    it("should return true for an environment that exists", async () => {
      await expect(env.exists("dev")).resolves.toEqual(true);
      expect(mockList.mock.calls.length).toEqual(1);
    });
    it("should return true for an environment that exists (case-insensitive)", async () => {
      await expect(env.exists("Staging")).resolves.toEqual(true);
      expect(mockList.mock.calls.length).toEqual(1);
    });
    it("should return false for an environment that doesn't exist", async () => {
      await expect(env.exists("production")).resolves.toEqual(false);
      expect(mockList.mock.calls.length).toEqual(1);
    });
    it("should return false for an environment with an invalid name", async () => {
      await expect(env.exists(".dev")).resolves.toEqual(false);
      expect(mockList.mock.calls.length).toEqual(0);
    });
  });

  describe("get", () => {
    it("should return the contents of the files if they exist", () => {});
  });
});
