/**
 * Server-rendered SVG bar charts for the admin reports — no client
 * library, no hydration cost. One measure per chart, so a single hue
 * (pine) does the work and no legend is needed; the title names the
 * series. Marks follow the house chart spec: ≤24px thick, 4px rounded at
 * the data end and square at the baseline, hairline recessive gridlines,
 * text in ink tokens (never the series colour), selective direct labels,
 * and a native tooltip on every bar via <title>.
 */

export type BarDatum = {
  label: string; // axis label (may be blank to thin out a dense axis)
  value: number;
  tooltip: string; // full text for hover + the accessible name
};

const INK_MUTED = "#66726c";
const INK_BODY = "#4b5853";
const GRID = "#e5e3dc";
const SERIES = "#266058"; // pine-700
const SERIES_SOFT = "#a9c2bb"; // de-emphasis step of the same ramp

/** Clean tick values: 0..max in 4 steps rounded to 1/2/5 × 10^n. */
function niceTicks(max: number, steps = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

function roundedTopPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + rr}`,
    `Q${x},${y} ${x + rr},${y}`,
    `H${x + w - rr}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}

function roundedRightPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h / 2, w);
  return [
    `M${x},${y}`,
    `H${x + w - rr}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `Q${x + w},${y + h} ${x + w - rr},${y + h}`,
    `H${x}`,
    "Z",
  ].join(" ");
}

export function ColumnChart({
  data,
  height = 220,
  format = (v: number) => String(v),
  max: forcedMax,
  emphasizeLast = true,
  ariaLabel,
}: {
  data: BarDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Fix the top of the scale (e.g. 100 for a percentage). */
  max?: number;
  /** Colour the final bar in the full hue and the rest in the soft step. */
  emphasizeLast?: boolean;
  ariaLabel: string;
}) {
  const width = 720;
  const pad = { top: 16, right: 12, bottom: 28, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const ticks = forcedMax
    ? niceTicks(forcedMax).filter((t) => t <= forcedMax)
    : niceTicks(Math.max(...data.map((d) => d.value), 0));
  const top = forcedMax ?? ticks[ticks.length - 1]!;
  const y = (v: number) => pad.top + innerH - (top > 0 ? (v / top) * innerH : 0);

  const slot = innerW / Math.max(data.length, 1);
  const barW = Math.min(24, Math.max(4, slot - 2)); // 2px surface gap
  const xFor = (i: number) => pad.left + i * slot + (slot - barW) / 2;

  const lastIdx = data.length - 1;
  const maxIdx = data.reduce((m, d, i) => (d.value > (data[m]?.value ?? -1) ? i : m), 0);

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-auto w-full"
        style={{ fontFamily: "inherit" }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(t)}
              y2={y(t)}
              stroke={GRID}
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            <text
              x={pad.left - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              fontSize={11}
              fill={INK_MUTED}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {format(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const h = Math.max(0, y(0) - y(d.value));
          const isLast = i === lastIdx;
          const fill = emphasizeLast ? (isLast ? SERIES : SERIES_SOFT) : SERIES;
          return (
            <g key={i}>
              <path d={roundedTopPath(xFor(i), y(d.value), barW, h, 4)} fill={fill}>
                <title>{d.tooltip}</title>
              </path>
              {/* hit target wider than the mark */}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
              >
                <title>{d.tooltip}</title>
              </rect>
              {d.label && (
                <text
                  x={xFor(i) + barW / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill={INK_MUTED}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Selective direct labels: the extreme and the latest value only. */}
        {data.length > 0 &&
          [...new Set([maxIdx, lastIdx])].map((i) => {
            const d = data[i]!;
            if (d.value <= 0) return null;
            return (
              <text
                key={`lbl-${i}`}
                x={xFor(i) + barW / 2}
                y={y(d.value) - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill={INK_BODY}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {format(d.value)}
              </text>
            );
          })}

        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={y(0)}
          y2={y(0)}
          stroke={INK_MUTED}
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
      </svg>
    </figure>
  );
}

export function HorizontalBarChart({
  data,
  format = (v: number) => String(v),
  ariaLabel,
}: {
  data: BarDatum[];
  format?: (v: number) => string;
  ariaLabel: string;
}) {
  const width = 720;
  const rowH = 30;
  const barH = 18;
  const pad = { top: 4, right: 64, bottom: 4, left: 132 };
  const height = pad.top + pad.bottom + rowH * Math.max(data.length, 1);
  const innerW = width - pad.left - pad.right;
  const top = Math.max(...data.map((d) => d.value), 1);
  const w = (v: number) => (v / top) * innerW;

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">No data for this period.</p>;
  }

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-auto w-full"
        style={{ fontFamily: "inherit" }}
      >
        {data.map((d, i) => {
          const yTop = pad.top + i * rowH + (rowH - barH) / 2;
          const bw = Math.max(0, w(d.value));
          return (
            <g key={i}>
              <text
                x={pad.left - 10}
                y={yTop + barH / 2}
                dy="0.32em"
                textAnchor="end"
                fontSize={12}
                fill={INK_BODY}
              >
                {d.label}
              </text>
              <line
                x1={pad.left}
                x2={pad.left}
                y1={yTop - 2}
                y2={yTop + barH + 2}
                stroke={GRID}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              {bw > 0 && (
                <path d={roundedRightPath(pad.left, yTop, bw, barH, 4)} fill={SERIES}>
                  <title>{d.tooltip}</title>
                </path>
              )}
              <rect x={0} y={yTop - 4} width={width} height={barH + 8} fill="transparent">
                <title>{d.tooltip}</title>
              </rect>
              <text
                x={pad.left + bw + 8}
                y={yTop + barH / 2}
                dy="0.32em"
                fontSize={12}
                fontWeight={600}
                fill={INK_BODY}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {format(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
