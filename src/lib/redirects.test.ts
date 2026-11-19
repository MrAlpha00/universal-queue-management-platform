import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirects";

describe("safeRedirectPath", () => {
  it("keeps same-origin paths, including query and hash", () => {
    expect(safeRedirectPath("/appointments?status=ACTIVE")).toBe("/appointments?status=ACTIVE");
    expect(safeRedirectPath("/manage/demo/overview#queue")).toBe("/manage/demo/overview#queue");
  });

  it("falls back for missing values", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined, "/login")).toBe("/login");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example/phish")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example/phish")).toBe("/dashboard");
  });

  it("rejects backslash-normalized and encoded tricks", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/%5Cevil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/%2F%2Fevil.example")).toBe("/dashboard");
  });

  it("rejects non-path values", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeRedirectPath("dashboard")).toBe("/dashboard");
  });
});
