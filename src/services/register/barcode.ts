import type { ParsedScaleBarcode, ScaleBarcodeSettings } from "@/types/register";

const DEFAULT_SCALE_PREFIX = "20";

export function parseScaleBarcode(
  code: string,
  settings?: Partial<ScaleBarcodeSettings> | null,
): ParsedScaleBarcode | null {
  const prefix = settings?.prefix || DEFAULT_SCALE_PREFIX;
  const enabled = settings?.enabled ?? true;

  if (!enabled || code.length !== 13 || !code.startsWith(prefix)) {
    return null;
  }

  const plu = code.substring(2, 6);
  const weight = parseInt(code.substring(6, 11), 10) / 1000;
  if (!Number.isFinite(weight)) {
    return null;
  }

  return {
    kind: "weighted",
    rawCode: code,
    plu,
    weight,
  };
}
