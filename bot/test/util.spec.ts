import assert from "assert";
import { combineArrays } from "../src/utils";

describe("utils.ts", function () {
  describe("combineArrays", function () {
    it("Arrays of equal length", function () {
      const result = combineArrays<number, string>(
        [1, 2, 3, 4, 5],
        ["1", "2", "3", "4", "5"]
      );
      assert.strictEqual(result.length, 5);

      const makeshiftResult = [];
      for (let i = 1; i < 6; i++) {
        makeshiftResult.push({ left: i, right: i.toString() });
      }
      assert.deepStrictEqual(result, makeshiftResult);
    });

    it("Arrays with different lengths", function () {
      const result = combineArrays<number, string>(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        ["1", "2", "3", "4", "5"]
      );
      assert.equal(result.length, 10);

      const makeshiftResult = [];
      for (let i = 1; i < 11; i++) {
        makeshiftResult.push({
          left: i,
          right: i > 5 ? undefined : i.toString(),
        });
      }

      assert.deepStrictEqual(result, makeshiftResult);
    });
  });
});
