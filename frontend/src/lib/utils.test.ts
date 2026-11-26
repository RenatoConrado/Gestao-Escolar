import { describe, expect, it } from "vitest";
import { formatarCpf, formatarCpfEntrada, formatarTelefoneEntrada, hojeLocalISO } from "./utils";

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

  describe("formatadores de entrada", () => {
    it("padroniza CPF e telefone com limite de dígitos", () => {
      expect(formatarCpfEntrada("123456789001")).toBe("123.456.789-00");
      expect(formatarTelefoneEntrada("11987654321")).toBe("(11) 98765-4321");
      expect(formatarTelefoneEntrada("1133334444")).toBe("(11) 3333-4444");
    });
  });
});
