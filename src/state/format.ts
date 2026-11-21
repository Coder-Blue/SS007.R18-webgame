import type { Act, Season } from "~/domain";

const integer = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const oneDecimal = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export const formatBillion = (value: number): string => `${integer.format(Math.round(value))} tỷ`;

export const formatTonne = (value: number): string =>
  `${integer.format(Math.round(value))} nghìn tấn`;

export const formatPrice = (value: number): string => `${oneDecimal.format(value)} tr/tấn`;

export const formatPercent = (value: number): string => `${oneDecimal.format(value)}%`;

export const formatDelta = (value: number, unit = "tỷ"): string => {
  const sign = value > 0 ? "+" : "";

  return `${sign}${oneDecimal.format(value)} ${unit}`;
};

export const formatDate = (year: number, month: number): string => `Tháng ${month}/${year}`;

export const seasonLabel = (season: Season): string => {
  if (season === "spring") return "Xuân";

  if (season === "summer") return "Hạ";

  if (season === "autumn") return "Thu";

  return "Đông";
};

export const actLabel = (act: Act): string => {
  if (act === 1) return "Hồi I · Bao phủ và tích lũy lỗ";

  if (act === 2) return "Hồi II · Tranh luận tư nhân hóa";

  return "Hồi III · Phục hồi và hiện đại hóa";
};

export const shortActLabel = (act: Act): string =>
  `Hồi ${act === 1 ? "I" : act === 2 ? "II" : "III"}`;

export const formatSignedPercent = (value: number): string =>
  `${value > 0 ? "+" : ""}${oneDecimal.format(value)}%`;

export const riskLabel = (value: number, inverse = false): string => {
  const score = inverse ? 100 - value : value;

  if (score >= 75) return "An toàn";

  if (score >= 50) return "Cần chú ý";

  if (score >= 25) return "Rủi ro cao";

  return "Nguy hiểm";
};
