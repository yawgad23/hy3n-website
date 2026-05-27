import { describe, expect, it } from "vitest";
import {
  estimateFare,
  formatCedis,
  getDailyCommissionForVehicle,
  RIDE_CATEGORIES,
  EMERGENCY,
  MOMO,
  CURRENCY_SYMBOL,
  DAILY_COMMISSION,
} from "../shared/hy3n";

describe("HY3N — constants comply with product spec", () => {
  it("uses GH₵ as the currency symbol", () => {
    expect(CURRENCY_SYMBOL).toBe("GH₵");
    expect(formatCedis(38.4)).toBe("GH₵38.40");
    expect(formatCedis("106")).toBe("GH₵106.00");
    expect(formatCedis(null)).toBe("GH₵0.00");
  });

  it("uses the exact required emergency numbers (Police 191, Ambulance 193)", () => {
    expect(EMERGENCY.POLICE).toBe("191");
    expect(EMERGENCY.AMBULANCE).toBe("193");
  });

  it("uses the exact required MoMo payment details", () => {
    expect(MOMO.number).toBe("0546728330");
    expect(MOMO.name).toBe("Gad Agyeman Nyantakyi");
    expect(MOMO.business).toBe("Guydad Enterprise");
  });

  it("exposes all six required ride categories with exact labels", () => {
    const labels = RIDE_CATEGORIES.map((c) => c.label).sort();
    expect(labels).toEqual([
      "Comfort",
      "Executive",
      "Express Delivery",
      "Kantanka",
      "Okada",
      "Standard",
    ]);
  });
});

describe("HY3N — fare estimation in GH₵", () => {
  it("respects the minimum fare per category", () => {
    expect(estimateFare("standard", 0, 0)).toBe(12);
    expect(estimateFare("okada", 0, 0)).toBe(8);
    expect(estimateFare("executive", 0, 0)).toBe(40);
  });

  it("computes a sensible fare for typical trips", () => {
    // Standard: 12 km, 18 min => 5 + 2.2*12 + 0.3*18 = 5 + 26.4 + 5.4 = 36.80
    expect(estimateFare("standard", 12, 18)).toBeCloseTo(36.8, 2);
    // Okada: 5 km, 12 min => 3 + 1.5*5 + 0.2*12 = 3 + 7.5 + 2.4 = 12.90
    expect(estimateFare("okada", 5, 12)).toBeCloseTo(12.9, 2);
  });

  it("keeps premium categories priced higher than standard", () => {
    const d = 15;
    const t = 20;
    expect(estimateFare("comfort", d, t)).toBeGreaterThan(estimateFare("standard", d, t));
    expect(estimateFare("kantanka", d, t)).toBeGreaterThan(estimateFare("comfort", d, t));
    expect(estimateFare("executive", d, t)).toBeGreaterThan(estimateFare("kantanka", d, t));
  });
});

describe("HY3N — tiered daily commission", () => {
  it("charges Okada/Delivery drivers GH₵30 daily", () => {
    expect(DAILY_COMMISSION.okada).toBe(30);
    expect(DAILY_COMMISSION.delivery).toBe(30);
    expect(getDailyCommissionForVehicle("motorcycle")).toBe(30);
    expect(getDailyCommissionForVehicle("van")).toBe(30);
  });

  it("charges car/SUV drivers GH₵50 daily", () => {
    expect(DAILY_COMMISSION.car).toBe(50);
    expect(getDailyCommissionForVehicle("car")).toBe(50);
    expect(getDailyCommissionForVehicle("suv")).toBe(50);
  });
});
