import { ZodError, z } from "zod";
import { ZAmountStrSanitized, ZNonNegativeIntStr, ZPrincipalStrSanitized, escapeHtml } from "../src";

describe("zod validation", () => {
  it("can validate string numbers", () => {
    expect(ZNonNegativeIntStr.parse("1")).toBe("1");
    expect(ZNonNegativeIntStr.parse("0")).toBe("0");
    expect(ZNonNegativeIntStr.parse("123")).toBe("123");

    expect(() => ZNonNegativeIntStr.parse("-1")).toThrow(ZodError);
    expect(() => ZNonNegativeIntStr.parse("")).toThrow(ZodError);
    expect(() => ZNonNegativeIntStr.parse(" ")).toThrow(ZodError);
    expect(() => ZNonNegativeIntStr.parse("0001")).toThrow(ZodError);
    expect(() => ZNonNegativeIntStr.parse("hello")).toThrow(ZodError);
  });

  it("can validate principals", () => {
    expect(ZPrincipalStrSanitized.parse("aaaaa-aa")).toBe("aaaaa-aa");
    expect(ZPrincipalStrSanitized.parse("ryjl3-tyaaa-aaaaa-aaaba-cai")).toBe("ryjl3-tyaaa-aaaaa-aaaba-cai");
    expect(ZPrincipalStrSanitized.parse("3f7ke-okbus-y4jv7-54ofh-dxqkx-afvhw-kiavk-wzjbr-b73fr-5ifgm-cqe")).toBe(
      "3f7ke-okbus-y4jv7-54ofh-dxqkx-afvhw-kiavk-wzjbr-b73fr-5ifgm-cqe",
    );

    expect(() => ZPrincipalStrSanitized.parse("aaaaa-")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("-aaaaa")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse(" ")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("-")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("aaaaaaaa-aa")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("</div>")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("<script>alert('haha')</script>")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("hello world")).toThrow(ZodError);
  });

  it("can validate token amounts", () => {
    expect(ZAmountStrSanitized.parse("100")).toBe("100");
    expect(ZAmountStrSanitized.parse("1.001.234.567")).toBe("1.001.234.567");
    expect(ZAmountStrSanitized.parse("100.000,1234567")).toBe("100.000,1234567");

    expect(() => ZPrincipalStrSanitized.parse("")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse(" ")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("</div>")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("<script>alert('haha')</script>")).toThrow(ZodError);
    expect(() => ZPrincipalStrSanitized.parse("hello world")).toThrow(ZodError);
  });

  it("can escape stuff with sanitize-html", () => {
    expect(escapeHtml("</p><script>alert('haha')</script><p>")).toBe(
      "&lt;p&gt;&lt;/p&gt;&lt;script&gt;alert('haha')&lt;/script&gt;&lt;p&gt;",
    );

    const ZExample = z.string().min(1).transform(escapeHtml);
    expect(ZExample.parse("</p><script>alert('haha')</script><p>")).toBe(
      "&lt;p&gt;&lt;/p&gt;&lt;script&gt;alert('haha')&lt;/script&gt;&lt;p&gt;",
    );

    expect(ZExample.parse("hello world")).toBe("hello world");
  });
});
