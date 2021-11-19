import { envArgsUtil } from "../../../src/cli/lib/args/envArgsUtil";

describe("envArgsUtil", () => {
  describe("parseEnvPutPatchArgs", () => {
    it("should parse simple assignments", () => {
      const res = envArgsUtil.parseEnvPutPatchArgs({
        _unknown: ["foo=5", '{"bar": {"baz": 10}}', "bar.bang=5"],
      });

      expect(res.values.foo).toEqual(5);
      expect(res.values.bar.baz).toEqual(10);
      expect(res.values.bar.bang).toEqual(5);
    });

    it("should handle private values", () => {
      const res = envArgsUtil.parseEnvPutPatchArgs({
        _unknown: ["foo=5"],
        private: ["bar.bang=10"],
      });

      expect(res.values.foo).toEqual(5);
      expect(res.privates.bar.bang).toEqual(10);
    });

    it("should handle unset values", () => {
      const res = envArgsUtil.parseEnvPutPatchArgs({
        unset: ["foo"],
      });

      expect(res.values.foo).toEqual(undefined);
      expect(res.values.bar).toEqual(undefined);
      expect(res.values.hasOwnProperty("foo")).toEqual(true);
      expect(res.values.hasOwnProperty("bar")).toEqual(false);
    });
  });
});
