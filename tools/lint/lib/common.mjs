import fs from 'node:fs';
import path from 'node:path';

/** Parses --root <dir> and --json from the command line. */
export function parseArgs(argv = process.argv.slice(2)) {
  const args = { root: process.cwd(), json: false, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = path.resolve(argv[++i]);
    else if (argv[i] === '--json') args.json = true;
    else args.rest.push(argv[i]);
  }
  return args;
}

/** Collects findings and prints them in one format for all checks. */
export class Report {
  constructor(tool, root) {
    this.tool = tool;
    this.root = root;
    this.findings = [];
    this.seen = new Set();
  }

  add(severity, rule, file, line, message) {
    const rel = file ? path.relative(this.root, path.resolve(this.root, file)).split(path.sep).join('/') : '';
    const finding = { severity, rule, file: rel, line: line || 0, message };
    // The same model element can be reached through several services: report it once.
    const key = JSON.stringify(finding);
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.findings.push(finding);
  }

  error(rule, file, line, message) {
    this.add('error', rule, file, line, message);
  }

  warn(rule, file, line, message) {
    this.add('warning', rule, file, line, message);
  }

  /** Prints the findings and returns the process exit code. */
  finish(json = false) {
    const errors = this.findings.filter((f) => f.severity === 'error').length;
    const warnings = this.findings.length - errors;
    if (json) {
      process.stdout.write(JSON.stringify({ tool: this.tool, errors, warnings, findings: this.findings }) + '\n');
      return errors ? 1 : 0;
    }
    const sorted = [...this.findings].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
    for (const f of sorted) {
      const where = f.file ? `${f.file}${f.line ? ':' + f.line : ''}` : '(project)';
      console.log(`${f.severity.padEnd(7)} ${f.rule.padEnd(8)} ${where}  ${f.message}`);
    }
    console.log(`${this.tool}: ${errors} error(s), ${warnings} warning(s)`);
    return errors ? 1 : 0;
  }
}

const SKIP_DIRS = new Set(['node_modules', 'gen', 'dist', '.git', '@cds-models', 'coverage', '.lint-selftest']);

/** Lists all files under dir, relative to root, with forward slashes. */
export function walk(root, dir = '.', out = [], dirsOut = null) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const sub = path.posix.join(dir.split(path.sep).join('/'), entry.name);
      if (dirsOut) dirsOut.push(sub.replace(/^\.\//, ''));
      walk(root, sub, out, dirsOut);
    } else {
      out.push(path.posix.join(dir.split(path.sep).join('/'), entry.name).replace(/^\.\//, ''));
    }
  }
  return out;
}

export const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');
export const exists = (root, file) => fs.existsSync(path.join(root, file));

/** Line number (1-based) of a character index. */
export function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

export const isKebab = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
export const isPascal = (s) => /^[A-Z][A-Za-z0-9]*$/.test(s);
export const isCamel = (s) => /^[a-z][A-Za-z0-9]*$/.test(s);
export const isUpperSnake = (s) => /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(s);

/** Last capitalised word of a PascalCase or camelCase name. */
export function lastWord(name) {
  const words = name.match(/[A-Z]?[a-z0-9]+|[A-Z]+(?![a-z])/g);
  return words ? words[words.length - 1] : name;
}

/** Heuristic: does the name read as a plural noun? */
export function looksPlural(name) {
  const w = lastWord(name).toLowerCase();
  if (!w.endsWith('s')) return false;
  return !/(ss|us|is)$/.test(w);
}

/** Heuristic singular of a plural word. */
export function singular(word) {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y');
  if (/(ch|sh|x|ss)es$/i.test(word)) return word.replace(/es$/i, '');
  return word.replace(/s$/i, '');
}

/**
 * Minimal XML tag scanner for views and fragments.
 * Returns [{ tag, attrs: { name: value }, line }] and ignores comments.
 */
export function scanXml(text) {
  const clean = text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const tags = [];
  const tagRe = /<([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/g;
  let m;
  while ((m = tagRe.exec(clean))) {
    const attrs = {};
    const attrRe = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = attrRe.exec(m[2]))) attrs[a[1]] = a[2] ?? a[3];
    tags.push({ tag: m[1], attrs, line: lineAt(clean, m.index) });
  }
  return tags;
}
