import { describe, expect, it } from "vitest";
import { formatarCpf, hojeLocalISO } from "./utils";

describe("hojeLocalISO", () => {
  it("formats local date as YYYY-MM-DD without UTC shift", () => {
    const dataLocal = new Date(2026, 2, 15, 22, 30, 0);

    expect(hojeLocalISO(dataLocal)).toBe("2026-03-15");
  });
});

describe("formatarCpf", () => {
  it("formats 11-digit CPF and masks when requested", () => {
    expect(formatarCpf("12345678900")).toBe("123.456.789-00");
    expect(formatarCpf("12345678900", true)).toBe("***.456.***-**");
    expect(formatarCpf("***.456.***-**", true)).toBe("***.456.***-**");
    expect(formatarCpf(null)).toBe("—");
    expect(formatarCpf(undefined)).toBe("—");
  });
});
