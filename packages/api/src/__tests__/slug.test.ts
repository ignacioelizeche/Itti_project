import { describe, it, expect } from "vitest";
import { slugify } from "../utils/slug.js";

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("HELLO World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world test")).toBe("hello-world-test");
  });

  it("removes accented characters", () => {
    expect(slugify("cafetería")).toBe("cafeteria");
    expect(slugify("educación")).toBe("educacion");
    expect(slugify("gastronomía")).toBe("gastronomia");
  });

  it("removes special characters", () => {
    expect(slugify("hello!@#world$%^")).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello   world---test")).toBe("hello-world-test");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles string with only special chars", () => {
    expect(slugify("!@#$%")).toBe("");
  });

  it("handles ñ character", () => {
    expect(slugify("año")).toBe("ano");
  });

  it("handles composed name with city", () => {
    expect(slugify("Sushi & Sabor - Asunción")).toBe("sushi-sabor-asuncion");
  });
});
