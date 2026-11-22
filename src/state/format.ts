import type { Act, Season } from "~/domain";

const integer = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const oneDecimal = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const twoDecimal = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export const formatBillion = (value: number): string => `${integer.format(Math.round(value))} tỷ`;

export const formatSignedBillion = (value: number): string =>
  `${value > 0 ? "+" : ""}${integer.format(Math.round(value))} tỷ`;

export const formatEnergy = (value: number): string =>
  `${integer.format(Math.round(value))} triệu kWh`;

export const formatPower = (value: number): string => `${integer.format(Math.round(value))} MW`;

export const formatPrice = (value: number): string => `${integer.format(Math.round(value))} đ/kWh`;

export const formatPercent = (value: number): string => `${oneDecimal.format(value)}%`;

export const formatRatio = (value: number): string => `${twoDecimal.format(value)}`;

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
  if (act === 1) return "Chặng 1 · Mua điện cạnh tranh";

  if (act === 2) return "Chặng 2 · Hạn hán và phụ tải đỉnh";

  if (act === 3) return "Chặng 3 · Tranh luận tư nhân hóa";

  return "Chặng 4 · Luật Điện lực sửa đổi";
};

export const shortActLabel = (act: Act): string => `Chặng ${act}`;

export const formatSignedPercent = (value: number): string =>
  `${value > 0 ? "+" : ""}${oneDecimal.format(value)}%`;

export const riskLabel = (value: number, inverse = false): string => {
  const score = inverse ? 100 - value : value;

  if (score >= 75) return "An toàn";

  if (score >= 50) return "Cần chú ý";

  if (score >= 25) return "Rủi ro cao";

  return "Nguy hiểm";
};
