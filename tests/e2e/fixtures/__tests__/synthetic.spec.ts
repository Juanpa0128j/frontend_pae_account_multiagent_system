import { test, expect } from "@playwright/test";
import * as fs from "fs";
import { makeMalformedPdf, makeOversizedPdf, makeWrongAreaCopy } from "../synthetic";
import { catalogFixtures } from "../catalog";

test.describe("synthetic fixtures", () => {
  test("makeMalformedPdf produces a truncated file", () => {
    const validPdf = catalogFixtures().find((f) => f.ext === ".pdf")!;
    const out = makeMalformedPdf(validPdf.path);
    expect(fs.existsSync(out)).toBe(true);
    expect(fs.statSync(out).size).toBeLessThan(2048);
    fs.unlinkSync(out);
  });

  test("makeOversizedPdf produces >20MB file", () => {
    const validPdf = catalogFixtures().find((f) => f.ext === ".pdf")!;
    const out = makeOversizedPdf(validPdf.path);
    expect(fs.statSync(out).size).toBeGreaterThan(20 * 1024 * 1024);
    fs.unlinkSync(out);
  });

  test("makeWrongAreaCopy returns Vía B fixture path renamed for Vía A use", () => {
    const all = catalogFixtures();
    const viaB = all.find((f) => f.via === "B");
    if (!viaB) test.skip(true, "no Vía B fixture available");
    const out = makeWrongAreaCopy(viaB!.path);
    expect(fs.existsSync(out)).toBe(true);
    fs.unlinkSync(out);
  });
});
