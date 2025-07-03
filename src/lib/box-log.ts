/**
 * @source https://github.com/sindresorhus/boxen/blob/main/index.js
 * Zero‑dependency re‑implementation of `boxen`.
 * The goal is API‑compatibility for the commonly‑used surface
 * while avoiding all runtime dependencies
 *
 * Limitations compared with the original:
 *  – Unicode width handling is "good‑enough", not full WCWidth spec.
 *  – Word‑wrapping is greedy (no soft‑wrapping on word boundaries).
 *  – Only the colour names accepted by chalk plus `#RRGGBB` hex.
 *  – No Windows CMD colour fallback (24‑bit only).
 */

import process from 'node:process';

/* ------------------------------------------------------------------ */
/*  Border styles (inlined from cli‑boxes)                            */
/* ------------------------------------------------------------------ */
type Border = {
  topLeft: string;
  top: string;
  topRight: string;
  right: string;
  bottomRight: string;
  bottom: string;
  bottomLeft: string;
  left: string;
};

const borderStyles: Record<string, Border> = {
  // copied verbatim from cli‑boxes :contentReference[oaicite:0]{index=0}
  single: {
    topLeft: '┌',
    top: '─',
    topRight: '┐',
    right: '│',
    bottomRight: '┘',
    bottom: '─',
    bottomLeft: '└',
    left: '│',
  },
  double: {
    topLeft: '╔',
    top: '═',
    topRight: '╗',
    right: '║',
    bottomRight: '╝',
    bottom: '═',
    bottomLeft: '╚',
    left: '║',
  },
  round: {
    topLeft: '╭',
    top: '─',
    topRight: '╮',
    right: '│',
    bottomRight: '╯',
    bottom: '─',
    bottomLeft: '╰',
    left: '│',
  },
  bold: {
    topLeft: '┏',
    top: '━',
    topRight: '┓',
    right: '┃',
    bottomRight: '┛',
    bottom: '━',
    bottomLeft: '┗',
    left: '┃',
  },
  singleDouble: {
    topLeft: '╓',
    top: '─',
    topRight: '╖',
    right: '║',
    bottomRight: '╜',
    bottom: '─',
    bottomLeft: '╙',
    left: '║',
  },
  doubleSingle: {
    topLeft: '╒',
    top: '═',
    topRight: '╕',
    right: '│',
    bottomRight: '╛',
    bottom: '═',
    bottomLeft: '╘',
    left: '│',
  },
  classic: {
    topLeft: '+',
    top: '-',
    topRight: '+',
    right: '|',
    bottomRight: '+',
    bottom: '-',
    bottomLeft: '+',
    left: '|',
  },
  arrow: {
    topLeft: '↘',
    top: '↓',
    topRight: '↙',
    right: '←',
    bottomRight: '↖',
    bottom: '↑',
    bottomLeft: '↗',
    left: '→',
  },
  none: {
    topLeft: '',
    top: '',
    topRight: '',
    right: '',
    bottomRight: '',
    bottom: '',
    bottomLeft: '',
    left: '',
  },
};

/* ------------------------------------------------------------------ */
/*  ANSI colour helpers (chalk‑lite)                                  */
/* ------------------------------------------------------------------ */
type ColorName = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';

const ansi = {
  fg: { black: 30, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37, gray: 90 },
  bg: { black: 40, red: 41, green: 42, yellow: 43, blue: 44, magenta: 45, cyan: 46, white: 47, gray: 100 },
  dim: '\u001B[2m',
  reset: '\u001B[0m',
};

function hexToRGB(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  const elem = m?.[1];
  if (!m || !elem) throw new Error(`Invalid hex colour: ${hex}`);
  const n =
    elem.length === 3 ?
      elem.split('').map((x) => parseInt(x + x, 16))
    : [0, 1, 2].map((i) => parseInt(elem.slice(i * 2, i * 2 + 2), 16));
  return n as [number, number, number];
}

function col(str: string, c?: string, bg = false): string {
  if (!c) return str;
  if (/^#/.test(c)) {
    const [r, g, b] = hexToRGB(c);
    return `\u001B[${bg ? 48 : 38};2;${r};${g};${b}m${str}${ansi.reset}`;
  }
  const code = (bg ? ansi.bg : ansi.fg)[c as ColorName];
  if (!code) throw new Error(`Unsupported colour: ${c}`);
  return `\u001B[${code}m${str}${ansi.reset}`;
}

/* ------------------------------------------------------------------ */
/*  String‑width & wrapping (lightweight replacements)                */
/* ------------------------------------------------------------------ */

/** crude wcwidth – wide CJK ranges get width 2, others 1, control 0 */
function charWidth(ch: string): number {
  const code = ch.codePointAt(0)!;
  // Control
  if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return 0;
  // Combining
  if (code >= 0x300 && code <= 0x36f) return 0;
  // Wide
  if (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2329 && code <= 0x232a) ||
    (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe19) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6)
  )
    return 2;
  return 1;
}

const ANSI_REGEX = /\u001B\[[0-9;]*m/g;

function stringWidth(str: string): number {
  return Array.from(str.replace(ANSI_REGEX, '')).reduce((w, ch) => w + charWidth(ch), 0);
}

function widestLine(str: string): number {
  return str.split('\n').reduce((m, l) => Math.max(m, stringWidth(l)), 0);
}

/** Hard‑wrap a string at *cols* visual columns */
function wrapAnsiHard(str: string, cols: number): string {
  // Process each line separately to preserve existing line breaks
  const lines = str.split('\n');
  const wrappedLines: string[] = [];

  for (const inputLine of lines) {
    // First, split the line into segments of text and ANSI codes
    const segments: Array<{ text: string; isAnsi: boolean }> = [];
    let lastIndex = 0;

    // Find all ANSI sequences
    const regex = new RegExp(ANSI_REGEX.source, 'g');
    let match;

    while ((match = regex.exec(inputLine)) !== null) {
      // Add text before the ANSI sequence
      if (match.index > lastIndex) {
        segments.push({ text: inputLine.slice(lastIndex, match.index), isAnsi: false });
      }
      // Add the ANSI sequence
      segments.push({ text: match[0], isAnsi: true });
      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < inputLine.length) {
      segments.push({ text: inputLine.slice(lastIndex), isAnsi: false });
    }

    // Now wrap this line, keeping ANSI sequences intact
    let lineOut = '';
    let currentLine = '';
    let width = 0;

    for (const segment of segments) {
      if (segment.isAnsi) {
        // ANSI sequences have no width and should stay with the current line
        currentLine += segment.text;
      } else {
        // Process visible text character by character
        for (const ch of Array.from(segment.text)) {
          const w = charWidth(ch);
          if (width + w > cols && width > 0) {
            lineOut += currentLine + '\n';
            currentLine = ch;
            width = w;
          } else {
            currentLine += ch;
            width += w;
          }
        }
      }
    }

    // Add the final part of the line
    if (currentLine) {
      lineOut += currentLine;
    }

    wrappedLines.push(lineOut);
  }

  return wrappedLines.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Padding / margin helpers                                          */
/* ------------------------------------------------------------------ */
interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
function sides(value: number | Partial<Sides> | undefined): Sides {
  if (value === undefined) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof value === 'number') return { top: value, right: value * 3, bottom: value, left: value * 3 };
  return { top: 0, right: 0, bottom: 0, left: 0, ...value };
}

/* ------------------------------------------------------------------ */
/*  API types                                                         */
/* ------------------------------------------------------------------ */
export interface BoxenOptions {
  padding?: number | Partial<Sides>;
  margin?: number | Partial<Sides>;
  borderStyle?: keyof typeof borderStyles | Border;
  borderColor?: ColorName | `#${string}`;
  backgroundColor?: ColorName | `#${string}`;
  dimBorder?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  float?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right'; // deprecated alias
  fullscreen?: boolean | ((w: number, h: number) => [number, number]);
}

/* ------------------------------------------------------------------ */
/*  Core helpers (adapted from original)                              */
/* ------------------------------------------------------------------ */

const NEWLINE = '\n',
  PAD = ' ';

function termColumns(): number {
  return (
    process.stdout.columns ||
    process.stderr.columns ||
    (process.env['COLUMNS'] ? parseInt(process.env['COLUMNS']!, 10) : 80)
  );
}

function makeTitle(text: string, horizontal: string, align: 'left' | 'center' | 'right'): string {
  const w = stringWidth(text);
  switch (align) {
    case 'left':
      return text + horizontal.slice(w);
    case 'right':
      return horizontal.slice(w) + text;
    case 'center':
    default: {
      let left = Math.floor((horizontal.length - w) / 2);
      let right = horizontal.length - w - left;
      return horizontal.slice(0, left) + text + horizontal.slice(horizontal.length - right);
    }
  }
}

function alignLine(line: string, width: number, align: 'left' | 'center' | 'right'): string {
  const len = stringWidth(line);
  if (len >= width) return line;
  const gap = width - len;
  switch (align) {
    case 'center':
      return PAD.repeat(Math.floor(gap / 2)) + line;
    case 'right':
      return PAD.repeat(gap) + line;
    default:
      return line;
  }
}

/* ------------------------------------------------------------------ */
/*  Main content builder                                              */
/* ------------------------------------------------------------------ */
export default function boxen(text: string, opts: BoxenOptions = {}): string {
  // defaults (match upstream) :contentReference[oaicite:1]{index=1}
  let options: Required<BoxenOptions> = {
    padding: 0,
    margin: 0,
    borderStyle: 'single',
    dimBorder: false,
    textAlignment: 'left',
    float: 'left',
    titleAlignment: 'left',
    width: undefined as any,
    height: undefined as any,
    borderColor: undefined as any,
    backgroundColor: undefined as any,
    title: undefined as any,
    align: undefined as any,
    fullscreen: undefined as any,
    ...opts,
  };

  // legacy alias
  if (options.align) options.textAlignment = options.align;

  // normalise sides
  const padding = sides(options.padding);
  const margin = sides(options.margin);

  /* -------- determine box width/height -------------------------- */
  const border =
    typeof options.borderStyle === 'string' ?
      (borderStyles[options.borderStyle] ?? borderStyles['single']!)
    : options.borderStyle;
  const borderWidth = border?.top ? 2 : 0; // 0 for 'none'

  // title pre‑formatting (borderless titles have no surrounding space)
  let titleStr =
    options.title ?
      border === borderStyles['none'] ?
        options.title
      : ` ${options.title} `
    : '';

  // wrap & align *content* first, we'll pad later
  const maxInner = options.width ? Math.max(1, options.width - padding.left - padding.right) : termColumns(); // provisional
  const wrapped = wrapAnsiHard(text, maxInner);
  const contentLines = wrapped
    .split('\n')
    .map((l) => alignLine(l, widestLine(wrapped), options.textAlignment));

  let innerWidth = widestLine(wrapped);
  if (titleStr) innerWidth = Math.max(innerWidth, stringWidth(titleStr));
  if (options.width) innerWidth = Math.min(innerWidth, options.width - padding.left - padding.right);

  // Safety
  if (innerWidth < 1) innerWidth = 1;

  /* -------- build content with padding -------------------------- */
  const horizPad = (s: string) =>
    PAD.repeat(padding.left) + s + PAD.repeat(innerWidth - stringWidth(s) + padding.right);
  let lines: string[] = [];

  for (let i = 0; i < padding.top; i++) lines.push(PAD.repeat(innerWidth + padding.left + padding.right));
  lines.push(...contentLines.map(horizPad));
  for (let i = 0; i < padding.bottom; i++) lines.push(PAD.repeat(innerWidth + padding.left + padding.right));

  // vertical crop / fill
  if (options.height && lines.length > options.height) lines = lines.slice(0, options.height);
  if (options.height && lines.length < options.height) {
    lines.push(
      ...Array(options.height - lines.length).fill(PAD.repeat(innerWidth + padding.left + padding.right)),
    );
  }

  const inner = lines.join(NEWLINE);

  /* -------- colour helpers -------------------------------------- */
  const colourBorder = (s: string) =>
    col(col(options.dimBorder ? ansi.dim + s + ansi.reset : s, options.borderColor), undefined);
  const colourText = (s: string) => (options.backgroundColor ? col(s, options.backgroundColor, true) : s);

  /* -------- render top/bottom borders --------------------------- */
  const horizontal = border.top.repeat(innerWidth + padding.left + padding.right);
  const top =
    border.topLeft +
    (titleStr ? makeTitle(titleStr, horizontal, options.titleAlignment) : horizontal) +
    border.topRight;
  const bottom =
    border.bottomLeft + border.bottom.repeat(innerWidth + padding.left + padding.right) + border.bottomRight;

  /* -------- assemble full box ----------------------------------- */
  const boxed = [
    border.top ? colourBorder(top) : undefined,
    inner
      .split('\n')
      .map((l) => colourBorder(border.left) + colourText(l) + colourBorder(border.right))
      .join(NEWLINE),
    border.bottom ? colourBorder(bottom) : undefined,
  ]
    .filter(Boolean)
    .join(NEWLINE);

  /* -------- apply margin / float -------------------------------- */
  const cols = termColumns();
  let leftMargin = PAD.repeat(margin.left);

  if (options.float === 'center')
    leftMargin = PAD.repeat(Math.max(0, Math.floor((cols - innerWidth - borderWidth) / 2)));
  if (options.float === 'right')
    leftMargin = PAD.repeat(Math.max(0, cols - innerWidth - borderWidth - margin.right));

  const withMargins =
    NEWLINE.repeat(margin.top) +
    boxed
      .split('\n')
      .map((l) => leftMargin + l)
      .join(NEWLINE) +
    NEWLINE.repeat(margin.bottom);

  return withMargins;
}

/* ------------------------------------------------------------------ */
/*  Named export for border styles (parity with original API)         */
/* ------------------------------------------------------------------ */
export const _borderStyles = borderStyles;
