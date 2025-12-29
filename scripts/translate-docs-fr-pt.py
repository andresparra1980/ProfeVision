#!/usr/bin/env python3
"""
Translate ProfeVision documentation from EN to FR/PT
Uses OpenRouter API with Gemini 2.0 Flash
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import requests
from time import sleep

# Configuration
OPENROUTER_API_KEY = "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"
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-3-flash-preview"  # Fast and high quality

# Paths
DOCS_DIR = Path(__file__).parent.parent / "apps" / "docs" / "content" / "docs"

# Translation prompts
TRANSLATION_PROMPTS = {
    "fr": """You are translating ProfeVision documentation from English to French.

Context: ProfeVision is an exam management platform for teachers.

Guidelines:
1. Use formal tone (vous, not tu)
2. Keep technical terms consistent:
   - "dashboard" → "tableau de bord"
   - "exam" → "examen"
   - "grade/grading" → "notation/noter"
   - "scan" → "numériser"
   - "student" → "étudiant"
   - "teacher" → "enseignant"
3. Preserve markdown formatting (**, -, #, [], (), etc.)
4. DO NOT translate:
   - Code blocks (```...```)
   - Component names (<Card>, <Cards>, etc.)
   - File paths (/docs/getting-started)
   - URLs (https://...)
   - HTML attributes (className, href, etc.)
5. Keep the same structure and paragraph breaks

Translate this text to French:""",
    
    "pt": """You are translating ProfeVision documentation from English to Brazilian Portuguese.

Context: ProfeVision is an exam management platform for teachers.

Guidelines:
1. Use formal tone (você)
2. Use Brazilian Portuguese spelling and terms
3. Keep technical terms consistent:
   - "dashboard" → "painel"
   - "exam" → "exame"
   - "grade/grading" → "correção/corrigir" or "nota/avaliar"
   - "scan" → "digitalizar"
   - "student" → "aluno"
   - "teacher" → "professor"
4. Preserve markdown formatting (**, -, #, [], (), etc.)
5. DO NOT translate:
   - Code blocks (```...```)
   - Component names (<Card>, <Cards>, etc.)
   - File paths (/docs/getting-started)
   - URLs (https://...)
   - HTML attributes (className, href, etc.)
6. Keep the same structure and paragraph breaks

Translate this text to Brazilian Portuguese:"""
}


def extract_frontmatter(content: str) -> Tuple[Dict, str]:
    """Extract YAML frontmatter from MDX content"""
    match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not match:
        return {}, content
    
    frontmatter_str = match.group(1)
    body = match.group(2)
    
    # Parse simple YAML (title and description only)
    frontmatter = {}
    for line in frontmatter_str.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip().strip('"').strip("'")
    
    return frontmatter, body


def translate_text(text: str, target_lang: str) -> str:
    """Translate text using OpenRouter API"""
    if not text.strip():
        return text
    
    prompt = TRANSLATION_PROMPTS[target_lang]
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://profevision.com",
        "X-Title": "ProfeVision Docs Translation"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": f"{prompt}\n\n{text}"
            }
        ]
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        
        translated = result["choices"][0]["message"]["content"]
        return translated.strip()
    
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return text


def translate_mdx_file(source_file: Path, target_lang: str) -> str:
    """Translate an MDX file"""
    print(f"📄 Translating {source_file.name} to {target_lang.upper()}...")
    
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract frontmatter and body
    frontmatter, body = extract_frontmatter(content)
    
    # Translate frontmatter
    translated_frontmatter = {}
    for key, value in frontmatter.items():
        if key in ['title', 'description']:
            print(f"  → Translating {key}: {value[:50]}...")
            translated_frontmatter[key] = translate_text(value, target_lang)
            sleep(0.5)  # Rate limiting
        else:
            translated_frontmatter[key] = value
    
    # Split body into chunks (preserve code blocks)
    chunks = []
    current_chunk = []
    in_code_block = False
    
    for line in body.split('\n'):
        if line.strip().startswith('```'):
            # Save current chunk
            if current_chunk:
                chunks.append(('\n'.join(current_chunk), False))
                current_chunk = []
            in_code_block = not in_code_block
            chunks.append((line, True))  # Code fence
        elif in_code_block:
            chunks.append((line, True))  # Code content
        else:
            current_chunk.append(line)
    
    if current_chunk:
        chunks.append(('\n'.join(current_chunk), False))
    
    # Translate non-code chunks
    translated_chunks = []
    for chunk, is_code in chunks:
        if is_code or not chunk.strip():
            translated_chunks.append(chunk)
        else:
            print(f"  → Translating chunk ({len(chunk)} chars)...")
            translated = translate_text(chunk, target_lang)
            translated_chunks.append(translated)
            sleep(0.5)  # Rate limiting
    
    # Rebuild file
    result = "---\n"
    for key, value in translated_frontmatter.items():
        result += f"{key}: {value}\n"
    result += "---\n\n"
    result += '\n'.join(translated_chunks)
    
    return result


def translate_meta_json(source_file: Path, target_lang: str) -> Dict:
    """Translate a meta.json file"""
    print(f"📋 Translating {source_file.name} to {target_lang.upper()}...")
    
    with open(source_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    translated = {}
    for key, value in data.items():
        if key == 'title':
            print(f"  → Translating title: {value}")
            translated[key] = translate_text(value, target_lang)
            sleep(0.5)
        elif key == 'pages':
            # Don't translate page IDs
            translated[key] = value
        else:
            translated[key] = value
    
    return translated


def process_directory(directory: Path, target_lang: str):
    """Process all files in a directory"""
    print(f"\n{'='*60}")
    print(f"Processing: {directory.relative_to(DOCS_DIR)}")
    print(f"Target language: {target_lang.upper()}")
    print(f"{'='*60}\n")
    
    # Translate meta.json if exists
    meta_en = directory / "meta.en.json"
    if meta_en.exists():
        translated_meta = translate_meta_json(meta_en, target_lang)
        output_file = directory / f"meta.{target_lang}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(translated_meta, f, ensure_ascii=False, indent=2)
        print(f"✅ Created {output_file.name}\n")
    
    # Translate .en.mdx files
    for mdx_file in sorted(directory.glob("*.en.mdx")):
        base_name = mdx_file.name.replace('.en.mdx', '')
        output_file = directory / f"{base_name}.{target_lang}.mdx"
        
        if output_file.exists():
            print(f"⏭️  Skipping {mdx_file.name} (already exists)\n")
            continue
        
        translated_content = translate_mdx_file(mdx_file, target_lang)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        
        print(f"✅ Created {output_file.name}\n")


def main():
    """Main execution"""
    if len(sys.argv) < 2:
        print("Usage: python translate-docs-fr-pt.py [--target meta|index|content|all] [--lang fr|pt|both]")
        print("\nExamples:")
        print("  python translate-docs-fr-pt.py --target meta --lang both")
        print("  python translate-docs-fr-pt.py --target index --lang fr")
        print("  python translate-docs-fr-pt.py --target all --lang pt")
        sys.exit(1)
    
    # Parse arguments
    target = "all"
    lang = "both"
    
    for i, arg in enumerate(sys.argv):
        if arg == "--target" and i + 1 < len(sys.argv):
            target = sys.argv[i + 1]
        if arg == "--lang" and i + 1 < len(sys.argv):
            lang = sys.argv[i + 1]
    
    # Determine languages to process
    languages = ["fr", "pt"] if lang == "both" else [lang]
    
    print("\n" + "="*60)
    print("ProfeVision Docs Translation Script")
    print("="*60)
    print(f"Target: {target}")
    print(f"Languages: {', '.join(languages)}")
    print(f"Model: {MODEL}")
    print("="*60 + "\n")
    
    for target_lang in languages:
        if target in ["meta", "all"]:
            # Process all meta.json files
            print(f"\n🌍 Processing META files for {target_lang.upper()}...")
            for meta_file in DOCS_DIR.rglob("meta.en.json"):
                directory = meta_file.parent
                translated_meta = translate_meta_json(meta_file, target_lang)
                output_file = directory / f"meta.{target_lang}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(translated_meta, f, ensure_ascii=False, indent=2)
                print(f"✅ Created {output_file.relative_to(DOCS_DIR)}\n")
        
        if target in ["index", "all"]:
            # Process index files
            print(f"\n🏠 Processing INDEX files for {target_lang.upper()}...")
            for index_file in DOCS_DIR.rglob("index.en.mdx"):
                directory = index_file.parent
                output_file = directory / f"index.{target_lang}.mdx"
                
                if output_file.exists():
                    print(f"⏭️  Skipping {output_file.relative_to(DOCS_DIR)} (exists)\n")
                    continue
                
                translated_content = translate_mdx_file(index_file, target_lang)
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(translated_content)
                print(f"✅ Created {output_file.relative_to(DOCS_DIR)}\n")
        
        if target in ["content", "all"]:
            # Process all other .en.mdx files
            print(f"\n📚 Processing CONTENT files for {target_lang.upper()}...")
            for mdx_file in DOCS_DIR.rglob("*.en.mdx"):
                if mdx_file.name == "index.en.mdx":
                    continue  # Already processed
                
                directory = mdx_file.parent
                base_name = mdx_file.name.replace('.en.mdx', '')
                output_file = directory / f"{base_name}.{target_lang}.mdx"
                
                if output_file.exists():
                    print(f"⏭️  Skipping {output_file.relative_to(DOCS_DIR)} (exists)\n")
                    continue
                
                translated_content = translate_mdx_file(mdx_file, target_lang)
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(translated_content)
                print(f"✅ Created {output_file.relative_to(DOCS_DIR)}\n")
    
    print("\n" + "="*60)
    print("✅ Translation complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
