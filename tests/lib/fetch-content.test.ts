import { describe, it, expect } from "vitest";
import { isPrivateUrl } from "@/lib/ai/fetch-content";

describe("isPrivateUrl", () => {
  it("blocks localhost", () => {
    expect(isPrivateUrl("http://localhost/path")).toBe(true);
    expect(isPrivateUrl("http://127.0.0.1/path")).toBe(true);
  });

  it("blocks private IP ranges", () => {
    expect(isPrivateUrl("http://10.0.0.1/page")).toBe(true);
    expect(isPrivateUrl("http://192.168.1.1/page")).toBe(true);
    expect(isPrivateUrl("http://169.254.169.254/metadata")).toBe(true);
  });

  it("blocks 0.0.0.0", () => {
    expect(isPrivateUrl("http://0.0.0.0/page")).toBe(true);
  });

  it("allows public URLs", () => {
    expect(isPrivateUrl("https://example.com/page")).toBe(false);
    expect(isPrivateUrl("https://github.com/repo")).toBe(false);
  });

  it("blocks non-http protocols", () => {
    expect(isPrivateUrl("file:///etc/passwd")).toBe(true);
    expect(isPrivateUrl("ftp://server.com/file")).toBe(true);
  });
});
