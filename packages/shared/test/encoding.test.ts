import { fromCBOR, toCBOR } from "../src";

describe("cbor-x", () => {
  it("can encode and decode numeric key records", () => {
    const a = {
      test1: "stri",
      test2: 123,
      test3: {
        1: "haha",
        2: "test",
      },
    };

    const aCopy: typeof a = fromCBOR(toCBOR(a));

    expect(a).toEqual(aCopy);
    expect(1 in aCopy.test3).toBe(true);
  });
});
