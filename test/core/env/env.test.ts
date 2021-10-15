import { env } from "../../../src/core";
import { listSummary, EnvironmentSummary } from "../../../src/core/env/envListSummary";
import { mockedFn } from "../../util";

jest.mock("../../../src/core/env/envListSummary");

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

  describe("active", () => {
    it("should return the OWL_ENV value if it exists", async () => {
      const stubEnvironments: EnvironmentSummary[] = [{ name: "dev" }, { name: "staging" }];
      mockedFn(listSummary).mockImplementation(() => Promise.resolve(stubEnvironments));
      process.env.OWL_ENV = "staging";

      const active = (await env.getActive())._unsafeUnwrap();

      expect(active).toEqual("staging");
    });

    it("should return the default value if OWL_ENV value doesn't exist", async () => {
      const stubEnvironments: EnvironmentSummary[] = [{ name: "dev" }, { name: "staging" }];
      mockedFn(listSummary).mockImplementation(() => Promise.resolve(stubEnvironments));
      process.env.OWL_ENV = "foobar";

      const active = (await env.getActive())._unsafeUnwrap();

      expect(active).toEqual("dev");
    });

    it("should return the default value if OWL_ENV isn't set", async () => {
      const stubEnvironments: EnvironmentSummary[] = [{ name: "dev" }, { name: "staging" }];
      mockedFn(listSummary).mockImplementation(() => Promise.resolve(stubEnvironments));
      process.env.OWL_ENV = undefined;

      const active = (await env.getActive())._unsafeUnwrap();

      expect(active).toEqual("dev");
    });

    it("should return an error if there are no environments", async () => {
      const stubEnvironments: EnvironmentSummary[] = [];
      mockedFn(listSummary).mockImplementation(() => Promise.resolve(stubEnvironments));

      const res = await env.getActive();

      expect(res.isErr()).toEqual(true);
    });
  });
});
