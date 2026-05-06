import { test, expect } from "@playwright/test";
import { catalogFixtures, fixturesByDocType, FIXTURES_DIR } from "../catalog";
import * as fs from "fs";

test.describe("fixture catalog", () => {
  test("FIXTURES_DIR points to ejemplos_docs_ingesta", () => {
    expect(FIXTURES_DIR).toContain("ejemplos_docs_ingesta");
    expect(fs.existsSync(FIXTURES_DIR)).toBe(true);
  });

  test("catalogFixtures returns at least one PDF", () => {
    const all = catalogFixtures();
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((f) => f.path.endsWith(".pdf"))).toBe(true);
  });

  test("each fixture has inferred doc_type and via", () => {
    const all = catalogFixtures();
    for (const f of all) {
      expect(["A", "B"]).toContain(f.via);
      expect(typeof f.docType).toBe("string");
      expect(f.docType.length).toBeGreaterThan(0);
    }
  });

  test("fixturesByDocType groups correctly", () => {
    const groups = fixturesByDocType();
    expect(Object.keys(groups).length).toBeGreaterThan(0);
  });

  test("skips files larger than 20MB", () => {
    const all = catalogFixtures();
    for (const f of all) {
      expect(f.sizeBytes).toBeLessThanOrEqual(20 * 1024 * 1024);
    }
  });
});
