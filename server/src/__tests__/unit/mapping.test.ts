import { describe, it, expect } from "bun:test";
import { suggestMapping, type LLMCaller } from "../../services/mapping.service.js";

const HEADERS = ["Straße", "Nr.", "PLZ", "Stadt", "Kaufpreis", "Objektart"];
const PREVIEW = [
  ["Hauptstraße", "10", "10115", "Berlin", "250.000", "Wohnung"],
  ["Gartenweg", "5", "80331", "München", "650.000", "Haus"],
];

function mockLLM(response: string): LLMCaller {
  return async () => response;
}

describe("suggestMapping", () => {
  it("returns valid mapping from LLM response", async () => {
    const llmResponse = JSON.stringify({
      "Straße": "strasse",
      "Nr.": "hausnummer",
      "PLZ": "plz",
      "Stadt": "ort",
      "Kaufpreis": "preis",
      "Objektart": "typ",
    });

    const result = await suggestMapping(HEADERS, PREVIEW, mockLLM(llmResponse));
    expect(result).toEqual({
      "Straße": "strasse",
      "Nr.": "hausnummer",
      "PLZ": "plz",
      "Stadt": "ort",
      "Kaufpreis": "preis",
      "Objektart": "typ",
    });
  });

  it("handles null values for unmapped columns", async () => {
    const llmResponse = JSON.stringify({
      "Straße": "strasse",
      "Nr.": null,
      "PLZ": "plz",
      "Stadt": "ort",
      "Kaufpreis": null,
      "Objektart": "typ",
    });

    const result = await suggestMapping(HEADERS, PREVIEW, mockLLM(llmResponse));
    expect(result).not.toBeNull();
    expect(result!["Nr."]).toBeNull();
    expect(result!["Kaufpreis"]).toBeNull();
  });

  it("returns null for invalid JSON response", async () => {
    const result = await suggestMapping(HEADERS, PREVIEW, mockLLM("not json at all"));
    expect(result).toBeNull();
  });

  it("returns null for invalid field names", async () => {
    const llmResponse = JSON.stringify({
      "Straße": "invalid_field_name",
      "Nr.": "hausnummer",
    });

    const result = await suggestMapping(HEADERS, PREVIEW, mockLLM(llmResponse));
    expect(result).toBeNull();
  });

  it("returns null when LLM throws an error", async () => {
    const errorLLM: LLMCaller = async () => {
      throw new Error("API unavailable");
    };

    await expect(suggestMapping(HEADERS, PREVIEW, errorLLM)).rejects.toThrow("API unavailable");
  });
});
