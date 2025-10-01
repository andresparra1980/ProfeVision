#!/usr/bin/env node
/*
 Detect duplicate keys in JSON files without relying on JSON.parse (which discards duplicates).
 Usage: node scripts/check-duplicate-keys.js <file1.json> [file2.json ...]
 Output: For each file, prints duplicate keys grouped by object path.
*/

const fs = require('fs');
const path = require('path');

function scanForDuplicateKeys(text) {
  const results = []; // { path: 'a.b.c', key: 'k', index: i }

  // State machine
  let i = 0;
  const len = text.length;
  const stack = []; // entries: { type: 'object'|'array', keys?: Set<string> }
  let inString = false;
  let stringQuote = '';
  let escapeNext = false;
  let expectingKey = false; // Only valid inside object when expecting a key

  function current() { return stack[stack.length - 1]; }
  function pathStr() {
    return stack
      .map((s) => s.name)
      .filter(Boolean)
      .join('.') || '$';
  }

  // We need to capture keys only when we see a string immediately followed by optional whitespace and a colon, inside an object.
  while (i < len) {
    const ch = text[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (ch === '\\') {
        escapeNext = true;
      } else if (ch === stringQuote) {
        inString = false;
        stringQuote = '';
      }
      i++;
      continue;
    }

    // Not in string
    if (ch === '"' || ch === "'") {
      // Start string
      inString = true;
      stringQuote = ch;
      // Capture the raw string content
      let j = i + 1;
      let str = '';
      let esc = false;
      while (j < len) {
        const cj = text[j];
        if (esc) {
          // naive unescape for quotes and backslash, keep others raw
          if (cj === '"' || cj === "'" || cj === '\\' || cj === 'n' || cj === 'r' || cj === 't' || cj === 'b' || cj === 'f') {
            str += '\\' + cj; // keep as-is, not evaluating escapes to preserve content
          } else {
            str += '\\' + cj;
          }
          esc = false;
          j++;
          continue;
        }
        if (cj === '\\') { esc = true; j++; continue; }
        if (cj === stringQuote) {
          break;
        }
        str += cj;
        j++;
      }
      // Now check if this string is a key (only if inside an object and next non-space char after the closing quote is ':')
      const obj = current();
      if (obj && obj.type === 'object') {
        // find next non-space after j (which is at the closing quote position)
        let k = j + 1;
        while (k < len && /\s/.test(text[k])) k++;
        if (text[k] === ':') {
          // Found a key
          const key = str;
          if (!obj.keys) obj.keys = new Set();
          if (obj.keys.has(key)) {
            results.push({ path: pathStr(), key, index: i });
          } else {
            obj.keys.add(key);
          }
        }
      }
      // advance i to the detected end-of-string (we'll let the main loop close string state)
      i = j; // the main loop will see stringQuote and close it next iteration
      continue;
    }

    if (ch === '{') {
      stack.push({ type: 'object' });
      i++;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      i++;
      continue;
    }
    if (ch === '[') {
      stack.push({ type: 'array' });
      i++;
      continue;
    }
    if (ch === ']') {
      stack.pop();
      i++;
      continue;
    }

    i++;
  }

  return results;
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node scripts/check-duplicate-keys.js <file1.json> [file2.json ...]');
    process.exit(1);
  }
  let exitCode = 0;
  for (const f of files) {
    const p = path.resolve(f);
    const txt = fs.readFileSync(p, 'utf8');
    const dups = scanForDuplicateKeys(txt);
    if (dups.length === 0) {
      console.log(`\n${f}: OK - no duplicate keys found.`);
      continue;
    }
    exitCode = 2;
    console.log(`\n${f}: Found ${dups.length} duplicate key occurrence(s):`);
    // Group by path
    const byPath = new Map();
    for (const d of dups) {
      const arr = byPath.get(d.path) || [];
      arr.push(d);
      byPath.set(d.path, arr);
    }
    for (const [pstr, arr] of byPath.entries()) {
      const keys = arr.map(a => a.key);
      console.log(`  - Path ${pstr}: duplicate keys -> ${Array.from(new Set(keys)).join(', ')}`);
    }
  }
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}
