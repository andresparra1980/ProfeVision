// Labels for i18n support in LaTeX export
export type LatexLabels = {
  group: string; // "Grupo:" / "Group:"
  instructions: string; // "Instrucciones:" / "Instructions:"
  duration: string; // "Duración:" / "Duration:"
  minutes: string; // "minutos" / "minutes"
  totalScore: string; // "Puntaje total:" / "Total score:"
  pts: string; // "pts" / "pts"
};

export type LatexOptions = {
  fontSize?: '8pt' | '10pt' | '12pt';
  columns?: 1 | 2 | 3;
  orientation?: 'portrait' | 'landscape';
  paper?: 'letter' | 'a4' | 'legal';
  columnBalance?: 'balanced' | 'unbalanced';
  institutionName?: string;
  subjectName?: string;
  title?: string;
  groupName?: string | null;
  dateText?: string | null;
  description?: string | null;
  instructions?: string | null;
  locale?: 'es' | 'en'; // For babel package
  labels?: LatexLabels;
};

export type ExamLike = {
  titulo: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  duracion_minutos: number;
  puntaje_total: number;
  materias: {
    nombre: string;
    entidad: { nombre: string };
  };
  preguntas: Array<{
    id: string;
    texto: string;
    puntaje: number;
    opciones_respuesta: Array<{ id: string; texto: string }>;
  }>;
};

// Escape LaTeX special chars outside math segments.
function escapeLatexOutsideMath(input: string): string {
  if (!input) return '';
  // Protect math segments $$...$$, $...$ and \\[...] using safe placeholders (no chars we escape)
  const segments: string[] = [];
  const makePh = (i: number) => `MATHPH${i}X`;
  let s = input
    // unify Windows newlines
    .replace(/\r\n/g, '\n');

  // Undo JSON escape sequences (\b, \t, \f, \r) that turn into literal control chars
  // when questions pass through JSON payloads. This restores LaTeX commands like \beta, \text, etc.
  const controlCharMap: Record<number, string> = {
    8: '\\b',
    9: '\\t',
    12: '\\f',
    13: '\\r'
  };
  Object.entries(controlCharMap).forEach(([code, replacement]) => {
    const char = String.fromCharCode(Number(code));
    if (s.includes(char)) {
      s = s.split(char).join(replacement);
    }
  });

  // Strip HTML tags (e.g. <p>, </p>) that may leak from rich text
  s = s.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  s = s
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"');

  // Normalize repeated backslash escaping that comes from DB/JSON (e.g. `$\\Delta$`, `$\\\\beta$`, `$\\\\\\text{}`)
  // Collapse any run of 2+ backslashes followed by a letter down to a single backslash so LaTeX commands survive
  // while keeping `\\[` or `\\(` intact because `[`/`(` are not letters
  s = s.replace(/\\{2,}(?=[A-Za-z])/g, '\\');

  // 1) Protect $$...$$ (display math)
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    const idx = segments.push('$$' + inner + '$$') - 1;
    return makePh(idx);
  });
  // 2) Protect \[ ... \]
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
    const idx = segments.push('\\[' + inner + '\\]') - 1;
    return makePh(idx);
  });
  // 3) Protect $...$ (inline math)
  s = s.replace(/\$([\s\S]*?)\$/g, (_m, inner) => {
    const idx = segments.push('$' + inner + '$') - 1;
    return makePh(idx);
  });

  // Escape outside of math
  s = s
    .replace(/([#%&_{}])/g, '\\$1')
    .replace(/\$/g, '\\$') // any stray $
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
  // Do NOT escape backslashes so sequences like \% remain valid LaTeX

  // Convert backticks to \texttt{} - backticks are not valid LaTeX
  // Match `...` patterns and wrap content in \texttt{}
  s = s.replace(/`([^`]+)`/g, '\\texttt{$1}');

  // Restore math segments
  s = s.replace(/MATHPH(\d+)X/g, (_m, i) => segments[Number(i)] || '');
  return s;
}

function latexPreamble(opts: LatexOptions): string {
  const fontSize = opts.fontSize ?? '10pt';
  const paper = opts.paper ?? 'letter';
  const orientation = opts.orientation ?? 'portrait';
  const columns = opts.columns ?? 2;
  const balance = opts.columnBalance ?? 'unbalanced';
  const locale = opts.locale ?? 'en';

  // geometry options: map to geometry keywords
  const paperOpt = paper === 'letter' ? 'letterpaper'
    : paper === 'a4' ? 'a4paper'
    : 'legalpaper';
  const orientOpt = orientation === 'landscape' ? 'landscape' : undefined; // portrait is default
  const geomOpts = [paperOpt, orientOpt, 'margin=2cm'].filter(Boolean).join(', ');

  // use extarticle when 8pt so it's a valid class option
  const klass = fontSize === '8pt' ? 'extarticle' : 'article';
  const classSize = fontSize === '8pt' ? '8pt' : fontSize; // 10pt or 12pt are valid with article

  // babel language
  const babelLang = locale === 'en' ? 'english' : 'spanish';

  return [
    `\\documentclass[${classSize}]{${klass}}`,
    `\\usepackage[${babelLang}]{babel}`,
    // Use modern Unicode engine defaults (Tectonic/XeTeX): fontspec for full Unicode support
    `\\usepackage{fontspec}`,
    `\\usepackage{microtype}`,
    `\\usepackage{amsmath,amssymb}`,
    `\\usepackage{siunitx}`,
    `\\usepackage{enumitem}`,
    `\\usepackage{multicol}`,
    `\\usepackage[colorlinks=false]{hyperref}`,
    `\\usepackage[${geomOpts}]{geometry}`,
    // make line breaking more forgiving to avoid overfull hboxes
    `\\emergencystretch=2em`,
    // tighten spacing a bit for exams
    `\\setlength{\\parskip}{0.3em}`,
    `\\setlength{\\parindent}{0em}`,
    // enumerate styles: bold label number and proper spacing/alignment
    `\\setlist[enumerate,1]{label=\\textbf{\\arabic*.}, labelsep=0.6em, leftmargin=*, itemsep=0.3em, align=parleft}`,
    `\\setlist[enumerate,2]{label=\\alph*), leftmargin=1.5em, itemsep=0.15em}`,
    '',
    `\\begin{document}`,
    columns > 1 ? (balance === 'unbalanced' ? `\\begin{multicols*}{${columns}}` : `\\begin{multicols}{${columns}}`) : ''
  ].filter(Boolean).join('\n');
}

// Default labels (Spanish)
const defaultLabels: LatexLabels = {
  group: 'Grupo:',
  instructions: 'Instrucciones:',
  duration: 'Duración:',
  minutes: 'minutos',
  totalScore: 'Puntaje total:',
  pts: 'pts',
};

function latexHeader(exam: ExamLike, opts: LatexOptions): string {
  const inst = escapeLatexOutsideMath(opts.institutionName ?? exam.materias.entidad.nombre);
  const subj = escapeLatexOutsideMath(opts.subjectName ?? exam.materias.nombre);
  const title = escapeLatexOutsideMath(opts.title ?? exam.titulo);
  const desc = opts.description ?? exam.descripcion ?? '';
  const instructions = opts.instructions ?? exam.instrucciones ?? '';
  const labels = opts.labels ?? defaultLabels;

  const lines: string[] = [];
  lines.push(`\\begin{center}`);
  lines.push(`\\textbf{${inst}}\\\\`);
  lines.push(`${subj}\\\\`);
  if (opts.groupName) lines.push(`${labels.group} ${escapeLatexOutsideMath(opts.groupName)}\\\\`);
  if (opts.dateText) lines.push(`${escapeLatexOutsideMath(opts.dateText)}\\\\`);
  lines.push(`\\vspace{0.5em}`);
  lines.push(`\\Large \\textbf{${title}}`);
  lines.push(`\\end{center}`);
  if (desc) {
    lines.push(`\\small ${escapeLatexOutsideMath(desc)}`);
    lines.push('');
  }
  if (instructions) {
    lines.push(`\\textbf{${labels.instructions}}`);
    lines.push(escapeLatexOutsideMath(instructions));
    lines.push('');
  }
  lines.push(`${labels.duration} ${exam.duracion_minutos} ${labels.minutes}\\hfill ${labels.totalScore} ${exam.puntaje_total}`);
  lines.push('');
  return lines.join('\n');
}

function latexQuestions(exam: ExamLike, opts: LatexOptions): string {
  const labels = opts.labels ?? defaultLabels;
  const q: string[] = [];
  q.push('\\begin{enumerate}');
  exam.preguntas.forEach((p) => {
    const text = escapeLatexOutsideMath(p.texto || '');
    // Permit content to break across columns/pages: avoid minipage so LaTeX can split naturally
    // Use declaration form {\bfseries ...} instead of \textbf{...} to avoid fragile-argument issues with long text
    q.push(`  \\item {\\bfseries ${text}} (\\emph{${p.puntaje} ${labels.pts}})`);
    if (p.opciones_respuesta && p.opciones_respuesta.length > 0) {
      q.push('    \\begin{enumerate}');
      p.opciones_respuesta.forEach((o) => {
        const ot = escapeLatexOutsideMath(o.texto || '');
        q.push(`      \\item ${ot}`);
      });
      q.push('    \\end{enumerate}');
    }
  });
  q.push('\\end{enumerate}');
  return q.join('\n');
}

function latexEnd(opts: LatexOptions): string {
  const columns = opts.columns ?? 2;
  const balance = opts.columnBalance ?? 'unbalanced';
  return [
    columns > 1 ? (balance === 'unbalanced' ? '\\end{multicols*}' : '\\end{multicols}') : '',
    '\\end{document}'
  ].filter(Boolean).join('\n');
}

export function buildExamTex(exam: ExamLike, opts: LatexOptions = {}): string {
  return [
    latexPreamble(opts),
    latexHeader(exam, opts),
    latexQuestions(exam, opts),
    latexEnd(opts)
  ].join('\n\n');
}
