import { env } from "../../src/core";

describe("env", () => {
  describe("isValidEnvironmentName", () => {
    it("should accept a dot in the name", () => {
      expect(env.isValidEnvironmentName("he.lo")).toEqual(true);
    });
    it("should allow non-ascii characters", () => {
      expect(env.isValidEnvironmentName("Éee")).toEqual(true);
    });
    it("should not allow windows filesystem issue characters", () => {
      expect(env.isValidEnvironmentName("a|name")).toEqual(false);
      expect(env.isValidEnvironmentName("a<name")).toEqual(false);
      expect(env.isValidEnvironmentName("a>name")).toEqual(false);
      expect(env.isValidEnvironmentName("a|name")).toEqual(false);
      expect(env.isValidEnvironmentName("a\\name")).toEqual(false);
      expect(env.isValidEnvironmentName("a:name")).toEqual(false);
      expect(env.isValidEnvironmentName("a?name")).toEqual(false);
      expect(env.isValidEnvironmentName("a*name")).toEqual(false);
      expect(env.isValidEnvironmentName('a"name')).toEqual(false);

      // just for good measure, let's try one that works too
      expect(env.isValidEnvironmentName("a]name")).toEqual(true);
    });
    it("should be trimmed", () => {
      expect(env.isValidEnvironmentName("   hello   ")).toEqual(false);
    });
    it("should not allow folder separator", () => {
      expect(env.isValidEnvironmentName("some/name")).toEqual(false);
    });
    it("should not allow empty string", () => {
      expect(env.isValidEnvironmentName("")).toEqual(false);
    });
    it("should not accept a dot at the start", () => {
      expect(env.isValidEnvironmentName(".helo")).toEqual(false);
    });
  });
});
