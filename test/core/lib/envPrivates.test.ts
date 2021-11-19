import { envPrivates } from "../../../src/core/lib/envPrivates";

describe("envPrivates", () => {
  describe("allKeysForPrivates", () => {
    it("should return top level keys", () => {
      const res = envPrivates.allKeysForPrivates({ foo: 5, bar: "hello" });
      expect(res).toEqual(["foo", "bar"]);
    });

    it("should not return keys with nested values", () => {
      const res = envPrivates.allKeysForPrivates({ foo: { bar: 5 } });
      expect(res).not.toContain("foo");
    });

    it("should return deeply nested leaf keys", () => {
      const res = envPrivates.allKeysForPrivates({ foo: { bar: 5, baz: { hello: 10, something: "yes" } } });
      expect(res).toContain("foo.bar");
      expect(res).toContain("foo.baz.hello");
      expect(res).toContain("foo.baz.something");
    });
  });
});
