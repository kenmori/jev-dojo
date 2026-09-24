/**
 * 実行結果から SVG の図を作る（plan.md §5.2）。
 * 図に数値を焼き込むのではなく、数値が変われば図も作り直す。外部ライブラリは使わない。
 */

const FONT = `font-family="-apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif"`;
const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#64748b"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function frame(width: number, height: number, title: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="16" y="24" ${FONT} font-size="15" font-weight="bold" fill="#111827">${esc(title)}</text>
${body}
</svg>
`;
}

export interface BarRow {
  label: string;
  value: number;
}

/** 横棒グラフ。値は 0〜max */
export function barChart(title: string, rows: BarRow[], max = 1): string {
  const labelW = 120;
  const barW = 300;
  const rowH = 26;
  const top = 44;
  const width = labelW + barW + 90;
  const height = top + rows.length * rowH + 12;
  const body = rows
    .map((r, i) => {
      const y = top + i * rowH;
      const w = Math.max(0, Math.min(1, r.value / max)) * barW;
      return [
        `<text x="${labelW - 8}" y="${y + 15}" text-anchor="end" ${FONT} font-size="12" fill="#374151">${esc(r.label)}</text>`,
        `<rect x="${labelW}" y="${y + 3}" width="${barW}" height="16" fill="#f3f4f6"/>`,
        `<rect x="${labelW}" y="${y + 3}" width="${w.toFixed(1)}" height="16" fill="${COLORS[0]}"/>`,
        `<text x="${labelW + barW + 8}" y="${y + 15}" ${FONT} font-size="12" fill="#111827">${r.value.toFixed(2)}</text>`,
      ].join("\n");
    })
    .join("\n");
  return frame(width, height, title, body);
}

export interface Series {
  name: string;
  values: number[];
}

/** グループ化した縦棒グラフ（例: 日本語と英語の比較） */
export function groupedBarChart(
  title: string,
  categories: string[],
  series: Series[],
  max = 1,
): string {
  const left = 48;
  const top = 64;
  const plotH = 200;
  const groupW = Math.max(60, 24 * series.length + 24);
  const width = left + categories.length * groupW + 24;
  const height = top + plotH + 48;
  const barW = (groupW - 24) / series.length;
  const parts: string[] = [];
  series.forEach((s, j) => {
    parts.push(
      `<rect x="${16 + j * 110}" y="36" width="12" height="12" fill="${COLORS[j % COLORS.length]}"/>`,
      `<text x="${32 + j * 110}" y="46" ${FONT} font-size="12" fill="#374151">${esc(s.name)}</text>`,
    );
  });
  for (let k = 0; k <= 4; k++) {
    const v = (max * k) / 4;
    const y = top + plotH - (plotH * k) / 4;
    parts.push(
      `<line x1="${left}" y1="${y}" x2="${width - 16}" y2="${y}" stroke="#e5e7eb"/>`,
      `<text x="${left - 6}" y="${y + 4}" text-anchor="end" ${FONT} font-size="11" fill="#6b7280">${v.toFixed(2)}</text>`,
    );
  }
  categories.forEach((c, i) => {
    const gx = left + i * groupW + 12;
    series.forEach((s, j) => {
      const v = s.values[i] ?? 0;
      const h = Number.isFinite(v) ? (Math.max(0, Math.min(max, v)) / max) * plotH : 0;
      parts.push(
        `<rect x="${(gx + j * barW).toFixed(1)}" y="${(top + plotH - h).toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="${COLORS[j % COLORS.length]}"/>`,
      );
    });
    parts.push(
      `<text x="${gx + (groupW - 24) / 2}" y="${top + plotH + 18}" text-anchor="middle" ${FONT} font-size="12" fill="#374151">${esc(c)}</text>`,
    );
  });
  return frame(width, height, title, parts.join("\n"));
}

export interface ReliabilityPoint {
  meanPredicted: number;
  observed: number;
  count: number;
}

/** 信頼度曲線。対角線に近いほど「言った確率どおりに当たる」 */
export function reliabilityDiagram(
  title: string,
  series: { name: string; points: ReliabilityPoint[] }[],
): string {
  const left = 56;
  const top = 64;
  const size = 260;
  const width = left + size + 40;
  const height = top + size + 56;
  const x = (v: number) => left + v * size;
  const y = (v: number) => top + size - v * size;
  const parts: string[] = [];
  series.forEach((s, j) => {
    parts.push(
      `<rect x="${16 + j * 110}" y="36" width="12" height="12" fill="${COLORS[j % COLORS.length]}"/>`,
      `<text x="${32 + j * 110}" y="46" ${FONT} font-size="12" fill="#374151">${esc(s.name)}</text>`,
    );
  });
  for (let k = 0; k <= 4; k++) {
    const v = k / 4;
    parts.push(
      `<line x1="${x(0)}" y1="${y(v)}" x2="${x(1)}" y2="${y(v)}" stroke="#f3f4f6"/>`,
      `<text x="${x(0) - 6}" y="${y(v) + 4}" text-anchor="end" ${FONT} font-size="11" fill="#6b7280">${v.toFixed(2)}</text>`,
      `<text x="${x(v)}" y="${y(0) + 16}" text-anchor="middle" ${FONT} font-size="11" fill="#6b7280">${v.toFixed(2)}</text>`,
    );
  }
  parts.push(
    `<rect x="${x(0)}" y="${y(1)}" width="${size}" height="${size}" fill="none" stroke="#9ca3af"/>`,
    `<line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" stroke="#9ca3af" stroke-dasharray="4 4"/>`,
    `<text x="${x(0.5)}" y="${y(0) + 36}" text-anchor="middle" ${FONT} font-size="12" fill="#374151">予測した確率</text>`,
    `<text x="16" y="${y(0.5)}" ${FONT} font-size="12" fill="#374151" transform="rotate(-90 16 ${y(0.5)})" text-anchor="middle">実際の割合</text>`,
  );
  series.forEach((s, j) => {
    const color = COLORS[j % COLORS.length];
    const pts = s.points.filter((p) => p.count > 0);
    if (pts.length > 1) {
      parts.push(
        `<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts.map((p) => `${x(p.meanPredicted).toFixed(1)},${y(p.observed).toFixed(1)}`).join(" ")}"/>`,
      );
    }
    for (const p of pts) {
      const r = 3 + Math.min(6, Math.sqrt(p.count));
      parts.push(
        `<circle cx="${x(p.meanPredicted).toFixed(1)}" cy="${y(p.observed).toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" fill-opacity="0.7"/>`,
      );
    }
  });
  return frame(width, height, title, parts.join("\n"));
}
