import { env } from "../../../src/core";
import { readdir } from "fs/promises";
import { Dirent } from "fs";
import { EnvironmentSummary } from "../../../src/core/env/listSummary";

jest.mock("fs/promises");

const mockedFn = <T extends (...args: any[]) => any>(thing: T): jest.MockedFunction<T> => {
  return thing as unknown as jest.MockedFunction<T>;
};

const stubFile = {
  isFile: () => true,
  isBlockDevice: () => false,
  isCharacterDevice: () => false,
  isDirectory: () => false,
  isFIFO: () => false,
  isSocket: () => false,
  isSymbolicLink: () => false,
};

const stubDir = {
  isFile: () => false,
  isBlockDevice: () => false,
  isCharacterDevice: () => false,
  isDirectory: () => true,
  isFIFO: () => false,
  isSocket: () => false,
  isSymbolicLink: () => false,
};

describe("env", () => {
  describe("listSummary", () => {
    const stubEntries: Dirent[] = [
      {
        name: ".config",
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isDirectory: () => false,
        isFile: () => true,
        isFIFO: () => false,
        isSocket: () => false,
        isSymbolicLink: () => false,
      },
    ];
    const mockReaddir = mockedFn(readdir).mockImplementation(() =>
      Promise.resolve([
        {
          name: ".config",
          ...stubFile,
        },
        {
          name: "a-directory.json",
          ...stubDir,
        },
        {
          name: ".invalid.json",
          ...stubFile,
        },
        {
          name: "inva|lid.json",
          ...stubFile,
        },
        {
          name: "zzzz.json",
          ...stubFile,
        },
        {
          name: "first.json",
          ...stubFile,
        },
        {
          name: "an.other.json",
          ...stubFile,
        },
        {
          name: "screenshot.png",
          ...stubFile,
        },
      ])
    );

    it("should return environments sorted", async () => {
      const summary = await env.listSummary();
      expect(summary[0]).toEqual({ name: "an.other" });
      expect(summary[summary.length - 1]).toEqual({ name: "zzzz" });
    });
    it("should not include directories", async () => {
      expectNotToInclude(await env.listSummary(), "a-directory");
    });
    it("should not include non-json files", async () => {
      expectNotToInclude(await env.listSummary(), "screenshot");
    });
    it("should not include invalid environment names", async () => {
      expectNotToInclude(await env.listSummary(), ".invalid");
    });
    it("should include environments", async () => {
      expectToInclude(await env.listSummary(), "first");
    });
    it("should include environments with dot in the middle", async () => {
      expectToInclude(await env.listSummary(), "an.other");
    });
  });
});

const expectToInclude = (summaries: EnvironmentSummary[], env: string) => {
  const includes = Boolean(summaries.find((e) => e.name == env));
  expect(includes).toEqual(true);
};

const expectNotToInclude = (summaries: EnvironmentSummary[], env: string) => {
  const includes = Boolean(summaries.find((e) => e.name == env));
  expect(includes).toEqual(false);
};
