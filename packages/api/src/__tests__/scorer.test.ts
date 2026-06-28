import { describe, it, expect } from "vitest";

function getDigitalPresenceWeights(category: string | null): { instagram: number; facebook: number; website: number } {
  const cat = (category || "").toLowerCase();

  if (cat.includes("ecommerce") || cat.includes("tienda online") || cat.includes("marketplace")) {
    return { instagram: 0.25, facebook: 0.25, website: 0.50 };
  }
  if (cat.includes("restaurant") || cat.includes("comida") || cat.includes("gastronom") || cat.includes("cafe") || cat.includes("cafetería")) {
    return { instagram: 0.50, facebook: 0.30, website: 0.20 };
  }
  if (cat.includes("moda") || cat.includes("belleza") || cat.includes("fashion") || cat.includes("salón") || cat.includes("spa")) {
    return { instagram: 0.60, facebook: 0.25, website: 0.15 };
  }
  if (cat.includes("fitness") || cat.includes("gym") || cat.includes("gimnasio") || cat.includes("deporte")) {
    return { instagram: 0.55, facebook: 0.25, website: 0.20 };
  }
  if (cat.includes("entretenimiento") || cat.includes("eventos") || cat.includes("cinema") || cat.includes("teatro")) {
    return { instagram: 0.45, facebook: 0.40, website: 0.15 };
  }
  if (cat.includes("tecnología") || cat.includes("software") || cat.includes("saas") || cat.includes("tech")) {
    return { instagram: 0.20, facebook: 0.20, website: 0.60 };
  }
  if (cat.includes("educación") || cat.includes("educacion") || cat.includes("school") || cat.includes("universidad")) {
    return { instagram: 0.25, facebook: 0.35, website: 0.40 };
  }
  if (cat.includes("supermercado") || cat.includes("retail") || cat.includes("tienda") || cat.includes("mercado")) {
    return { instagram: 0.25, facebook: 0.40, website: 0.35 };
  }
  return { instagram: 0.45, facebook: 0.30, website: 0.25 };
}

function getScoreLabel(total: number): string {
  if (total >= 85) return "Muy recomendable";
  if (total >= 70) return "Buena candidata";
  if (total >= 50) return "Moderada";
  return "Baja afinidad";
}

describe("getDigitalPresenceWeights", () => {
  it("returns default weights for unknown category", () => {
    const w = getDigitalPresenceWeights("unknown");
    expect(w).toEqual({ instagram: 0.45, facebook: 0.30, website: 0.25 });
  });

  it("returns default weights for null", () => {
    const w = getDigitalPresenceWeights(null);
    expect(w).toEqual({ instagram: 0.45, facebook: 0.30, website: 0.25 });
  });

  it("returns ecommerce weights for ecommerce", () => {
    const w = getDigitalPresenceWeights("ecommerce");
    expect(w).toEqual({ instagram: 0.25, facebook: 0.25, website: 0.50 });
  });

  it("returns food weights for restaurant", () => {
    const w = getDigitalPresenceWeights("Restaurant");
    expect(w.instagram).toBe(0.50);
  });

  it("returns food weights for gastronomía", () => {
    const w = getDigitalPresenceWeights("Gastronomía");
    expect(w.instagram).toBe(0.50);
  });

  it("returns fashion weights for moda", () => {
    const w = getDigitalPresenceWeights("Moda");
    expect(w.instagram).toBe(0.60);
  });

  it("returns fitness weights for gimnasio", () => {
    const w = getDigitalPresenceWeights("Gimnasio");
    expect(w.instagram).toBe(0.55);
  });

  it("returns entertainment weights for entretenimiento", () => {
    const w = getDigitalPresenceWeights("Entretenimiento");
    expect(w.instagram).toBe(0.45);
    expect(w.facebook).toBe(0.40);
  });

  it("returns tech weights for tecnología", () => {
    const w = getDigitalPresenceWeights("Tecnología");
    expect(w.website).toBe(0.60);
  });

  it("returns education weights for educación", () => {
    const w = getDigitalPresenceWeights("Educación");
    expect(w.facebook).toBe(0.35);
    expect(w.website).toBe(0.40);
  });

  it("returns retail weights for supermercado", () => {
    const w = getDigitalPresenceWeights("Supermercado");
    expect(w.facebook).toBe(0.40);
    expect(w.website).toBe(0.35);
  });

  it("retail weights for tienda keyword", () => {
    const w = getDigitalPresenceWeights("Tienda de ropa");
    expect(w.facebook).toBe(0.40);
  });

  it("matches case-insensitively", () => {
    const w = getDigitalPresenceWeights("TECNOLOGÍA");
    expect(w.website).toBe(0.60);
  });

  it("all weights sum to 1", () => {
    const categories = ["Moda", "Tecnología", "Restaurant", null, "unknown", "Supermercado", "Gimnasio", "Educación", "Entretenimiento"];
    for (const cat of categories) {
      const w = getDigitalPresenceWeights(cat);
      const sum = Math.round((w.instagram + w.facebook + w.website) * 100) / 100;
      expect(sum).toBe(1);
    }
  });
});

describe("getScoreLabel", () => {
  it('returns "Muy recomendable" for score >= 85', () => {
    expect(getScoreLabel(85)).toBe("Muy recomendable");
    expect(getScoreLabel(100)).toBe("Muy recomendable");
  });

  it('returns "Buena candidata" for 70 <= score < 85', () => {
    expect(getScoreLabel(70)).toBe("Buena candidata");
    expect(getScoreLabel(84)).toBe("Buena candidata");
  });

  it('returns "Moderada" for 50 <= score < 70', () => {
    expect(getScoreLabel(50)).toBe("Moderada");
    expect(getScoreLabel(69)).toBe("Moderada");
  });

  it('returns "Baja afinidad" for score < 50', () => {
    expect(getScoreLabel(0)).toBe("Baja afinidad");
    expect(getScoreLabel(49)).toBe("Baja afinidad");
  });

  it("handles edge case at 49", () => {
    expect(getScoreLabel(49)).toBe("Baja afinidad");
  });

  it("handles edge case at 50", () => {
    expect(getScoreLabel(50)).toBe("Moderada");
  });

  it("handles edge case at 70", () => {
    expect(getScoreLabel(70)).toBe("Buena candidata");
  });

  it("handles edge case at 85", () => {
    expect(getScoreLabel(85)).toBe("Muy recomendable");
  });
});
