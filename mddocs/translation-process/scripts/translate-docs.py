#!/usr/bin/env python3
"""
Documentation (MDX) Translation Script for ProfeVision
Translates MDX files from Spanish to any target language using configurable prompts.

Usage:
    python translate-docs.py                    # Translate all enabled languages
    python translate-docs.py --lang de          # Translate only German
    python translate-docs.py --lang de,it       # Translate German and Italian
    python translate-docs.py --dry-run          # Preview without writing files
    python translate-docs.py --force            # Overwrite existing translations
"""

import argparse
import json
import os
import re
import sys
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
import time

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

try:
    import yaml
except ImportError:
    print("❌ Error: PyYAML not installed. Run: pip install pyyaml")
    sys.exit(1)


# =============================================================================
# CONFIGURATION
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
CONFIG_DIR = Path(__file__).parent.parent / "config"
DOCS_CONTENT_DIR = PROJECT_ROOT / "apps" / "docs" / "content" / "docs"

SOURCE_LANGUAGE = "es"  # Spanish .mdx files are the source


# =============================================================================
# CONFIG LOADER
# =============================================================================

class ConfigLoader:
    """Load and parse YAML configuration files."""
    
    @staticmethod
    def load_languages_config() -> Dict:
        """Load languages.yaml configuration."""
        config_file = CONFIG_DIR / "languages.yaml"
        if not config_file.exists():
            raise FileNotFoundError(f"Languages config not found: {config_file}")
        
        with open(config_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    @staticmethod
    def load_language_prompt(lang_code: str) -> Dict:
        """Load language-specific prompt configuration."""
        prompt_file = CONFIG_DIR / "prompts" / f"{lang_code}.yaml"
        if not prompt_file.exists():
            raise FileNotFoundError(
                f"Prompt config not found for {lang_code}: {prompt_file}\n"
                f"Create it using config/prompts/_template.yaml as reference."
            )
        
        with open(prompt_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    @staticmethod
    def load_prompt_template(template_name: str) -> str:
        """Load prompt template (Markdown)."""
        template_file = CONFIG_DIR / "prompts" / f"{template_name}.md"
        if not template_file.exists():
            raise FileNotFoundError(f"Prompt template not found: {template_file}")
        
        with open(template_file, 'r', encoding='utf-8') as f:
            return f.read()


# =============================================================================
# MDX PARSER
# =============================================================================

class MDXParser:
    """Parse and manipulate MDX files (frontmatter + content)."""
    
    @staticmethod
    def parse_mdx(content: str) -> Tuple[Optional[Dict], str]:
        """
        Parse MDX file into frontmatter and content.
        
        Returns:
            (frontmatter_dict, body_content)
        """
        # Match frontmatter: --- ... ---
        frontmatter_pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
        match = re.match(frontmatter_pattern, content, re.DOTALL)
        
        if match:
            frontmatter_raw = match.group(1)
            body = match.group(2)
            
            try:
                frontmatter = yaml.safe_load(frontmatter_raw)
            except yaml.YAMLError as e:
                print(f"⚠️  Warning: Could not parse frontmatter: {e}")
                frontmatter = None
            
            return frontmatter, body
        else:
            # No frontmatter
            return None, content
    
    @staticmethod
    def rebuild_mdx(frontmatter: Optional[Dict], body: str) -> str:
        """Rebuild MDX file from frontmatter and body."""
        if frontmatter:
            frontmatter_yaml = yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)
            return f"---\n{frontmatter_yaml}---\n{body}"
        else:
            return body
    
    @staticmethod
    def translate_frontmatter(frontmatter: Optional[Dict], translator, target_lang_config: Dict) -> Optional[Dict]:
        """
        Translate frontmatter fields (title, description).
        
        Only translates:
        - title
        - description
        
        Keeps unchanged:
        - icon
        - all other fields
        """
        if not frontmatter:
            return None
        
        translated = frontmatter.copy()
        
        # Translate title
        if 'title' in translated and translated['title']:
            print(f"    → Translating title: {translated['title'][:50]}")
            translated['title'] = translator.translate_short(
                translated['title'],
                target_lang_config,
                context="frontmatter title"
            )
        
        # Translate description
        if 'description' in translated and translated['description']:
            print(f"    → Translating description: {translated['description'][:50]}")
            translated['description'] = translator.translate_short(
                translated['description'],
                target_lang_config,
                context="frontmatter description"
            )
        
        return translated


# =============================================================================
# PROMPT BUILDER
# =============================================================================

class PromptBuilder:
    """Build translation prompts from templates and configs."""
    
    @staticmethod
    def build_docs_prompt(
        content: str,
        source_lang: str,
        target_lang_config: Dict,
    ) -> str:
        """Build prompt for documentation MDX translation."""
        
        # Load template
        template = ConfigLoader.load_prompt_template("docs-translations")
        
        # Format tech terms
        tech_terms_list = []
        for term_en, term_target in target_lang_config.get('tech_terms', {}).items():
            tech_terms_list.append(f"   - {term_en}: {term_target}")
        tech_terms = "\n".join(tech_terms_list)
        
        # Format examples
        examples_list = []
        for i, example in enumerate(target_lang_config.get('examples', []), 1):
            examples_list.append(
                f"{i}. Source: \"{example['source']}\"\n"
                f"   Target: \"{example['target']}\""
            )
        examples = "\n".join(examples_list) if examples_list else "No examples provided."
        
        # Replace template variables
        prompt = template.replace("{{SOURCE_LANG}}", source_lang.upper())
        prompt = prompt.replace("{{TARGET_LANG}}", target_lang_config['language'].upper())
        prompt = prompt.replace("{{TARGET_LANG_NAME}}", target_lang_config['language_english'])
        prompt = prompt.replace("{{FORMALITY}}", target_lang_config.get('formality', 'formal'))
        prompt = prompt.replace("{{FORMALITY_DETAILS}}", target_lang_config.get('formality_details', ''))
        prompt = prompt.replace("{{TECH_TERMS}}", tech_terms)
        prompt = prompt.replace("{{ADDITIONAL_GUIDELINES}}", target_lang_config.get('additional_guidelines', ''))
        prompt = prompt.replace("{{EXAMPLES}}", examples)
        prompt = prompt.replace("{{CONTENT}}", content)
        
        return prompt


# =============================================================================
# TRANSLATOR
# =============================================================================

class Translator:
    """Handle API calls to OpenRouter for translation."""
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not set. Export it or pass to constructor.")
        
        self.model = model or "google/gemini-3-flash-preview"
        self.rate_limit_delay = 0.5  # seconds between requests
    
    def translate(self, prompt: str) -> str:
        """Send translation request to OpenRouter API."""
        
        request_body = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        curl_cmd = [
            "curl",
            "-s",
            "-X", "POST",
            "https://openrouter.ai/api/v1/chat/completions",
            "-H", f"Authorization: Bearer {self.api_key}",
            "-H", "content-type: application/json",
            "-d", json.dumps(request_body)
        ]
        
        try:
            result = subprocess.run(
                curl_cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=120
            )
            response = json.loads(result.stdout)
            
            if "error" in response:
                raise ValueError(f"API error: {response['error'].get('message', 'Unknown error')}")
            
            translated_content = response["choices"][0]["message"]["content"].strip()
            
            # Rate limiting
            time.sleep(self.rate_limit_delay)
            
            return translated_content
            
        except subprocess.CalledProcessError as e:
            raise ValueError(f"Curl error: {e.stderr}")
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON decode error: {e}")
        except Exception as e:
            raise ValueError(f"Translation error: {str(e)}")
    
    def translate_short(self, text: str, target_lang_config: Dict, context: str = "") -> str:
        """Translate a short text (title, description) without full prompt template."""
        
        lang_name = target_lang_config['language_english']
        lang_code = target_lang_config['language'].upper()
        formality = target_lang_config.get('formality', 'formal')
        
        simple_prompt = f"""Translate the following text from Spanish to {lang_name} ({lang_code}).

Context: {context}
Tone: {formality}

Text to translate:
{text}

Return ONLY the translated text, nothing else."""
        
        return self.translate(simple_prompt)


# =============================================================================
# TRANSLATION ENGINE
# =============================================================================

class DocsTranslationEngine:
    """Main translation engine for documentation files."""
    
    def __init__(self, dry_run: bool = False, force: bool = False):
        self.dry_run = dry_run
        self.force = force
        self.config_loader = ConfigLoader()
        self.translator = Translator()
        self.mdx_parser = MDXParser()
    
    def translate_mdx_file(
        self,
        source_file: Path,
        target_file: Path,
        target_lang_config: Dict,
    ) -> bool:
        """Translate a single MDX file."""
        
        # Read source file
        with open(source_file, 'r', encoding='utf-8') as f:
            source_content = f.read()
        
        # Parse frontmatter and body
        frontmatter, body = self.mdx_parser.parse_mdx(source_content)
        
        # Translate frontmatter
        translated_frontmatter = self.mdx_parser.translate_frontmatter(
            frontmatter,
            self.translator,
            target_lang_config
        )
        
        # Split body into chunks (if needed for large docs)
        body_chunks = self._split_into_chunks(body, max_chars=3000)
        
        translated_chunks = []
        for i, chunk in enumerate(body_chunks, 1):
            if len(body_chunks) > 1:
                print(f"    → Translating chunk {i}/{len(body_chunks)} ({len(chunk)} chars)...")
            else:
                print(f"    → Translating content ({len(chunk)} chars)...")
            
            # Build prompt
            prompt = PromptBuilder.build_docs_prompt(
                chunk,
                SOURCE_LANGUAGE,
                target_lang_config
            )
            
            # Translate
            try:
                translated_chunk = self.translator.translate(prompt)
                translated_chunks.append(translated_chunk)
            except Exception as e:
                print(f"    ❌ Translation failed: {e}")
                return False
        
        # Combine chunks
        translated_body = "\n\n".join(translated_chunks)
        
        # Rebuild MDX
        translated_mdx = self.mdx_parser.rebuild_mdx(translated_frontmatter, translated_body)
        
        # Write file (or dry-run)
        if self.dry_run:
            print(f"    [DRY RUN] Would write to: {target_file}")
            print(f"    Preview (first 200 chars):\n{translated_mdx[:200]}...")
        else:
            target_file.parent.mkdir(parents=True, exist_ok=True)
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(translated_mdx)
            print(f"    ✅ Created {target_file.name}")
        
        return True
    
    def _split_into_chunks(self, text: str, max_chars: int = 3000) -> List[str]:
        """Split text into chunks by paragraphs (preserve markdown structure)."""
        
        if len(text) <= max_chars:
            return [text]
        
        # Split by double newlines (paragraphs)
        paragraphs = text.split("\n\n")
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            para_len = len(para)
            
            if current_length + para_len > max_chars and current_chunk:
                # Flush current chunk
                chunks.append("\n\n".join(current_chunk))
                current_chunk = [para]
                current_length = para_len
            else:
                current_chunk.append(para)
                current_length += para_len
        
        # Add remaining
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))
        
        return chunks
    
    def translate_language(self, lang_code: str) -> Dict[str, Any]:
        """Translate all MDX files for a language."""
        
        # Load configs
        target_lang_config = self.config_loader.load_language_prompt(lang_code)
        
        # Find all Spanish .mdx files (source)
        # Pattern: *.mdx or *.es.mdx in docs/content/docs/
        source_files = list(DOCS_CONTENT_DIR.glob("**/*.mdx"))
        
        # Filter to only Spanish files (*.mdx without lang suffix, or *.es.mdx)
        spanish_files = [
            f for f in source_files
            if f.suffix == ".mdx" and (
                not any(f.stem.endswith(f".{lc}") for lc in ["en", "fr", "pt", "de", "it", "zh", "ja", "ar", "ko", "ru", "hi", "nl", "pl"])
            )
        ]
        
        stats = {
            "total": len(spanish_files),
            "success": 0,
            "failed": 0,
            "skipped": 0
        }
        
        print(f"\n{'═' * 63}")
        print(f"📚 Processing CONTENT files for {lang_code.upper()}...")
        print(f"{'═' * 63}\n")
        
        for i, source_file in enumerate(spanish_files, 1):
            # Build target filename: change .mdx to .{lang}.mdx
            relative_path = source_file.relative_to(DOCS_CONTENT_DIR)
            
            # Target: same path but with .{lang}.mdx extension
            target_stem = source_file.stem
            target_file = DOCS_CONTENT_DIR / relative_path.parent / f"{target_stem}.{lang_code}.mdx"
            
            print(f"📄 [{i}/{stats['total']}] {source_file.name}")
            
            # Check if exists and not forcing
            if target_file.exists() and not self.force:
                print(f"    ⏭️  Skipped (exists, use --force to overwrite)")
                stats["skipped"] += 1
                continue
            
            # Translate
            success = self.translate_mdx_file(
                source_file,
                target_file,
                target_lang_config
            )
            
            if success:
                stats["success"] += 1
            else:
                stats["failed"] += 1
        
        return stats
    
    def translate_meta_json(self, lang_code: str) -> bool:
        """
        Translate meta.json files for docs navigation.
        
        These files define sidebar navigation structure.
        Pattern: apps/docs/content/docs/**/meta.json
        """
        
        print(f"\n{'─' * 63}")
        print(f"📑 Processing META.JSON files for {lang_code.upper()}...")
        print(f"{'─' * 63}\n")
        
        # Find all meta.json files
        meta_files = list(DOCS_CONTENT_DIR.glob("**/meta.json"))
        
        if not meta_files:
            print("  ℹ️  No meta.json files found")
            return True
        
        target_lang_config = self.config_loader.load_language_prompt(lang_code)
        
        for meta_file in meta_files:
            relative_path = meta_file.relative_to(DOCS_CONTENT_DIR)
            target_meta = DOCS_CONTENT_DIR / relative_path.parent / f"meta.{lang_code}.json"
            
            print(f"📑 {relative_path}")
            
            # Check if exists
            if target_meta.exists() and not self.force:
                print(f"    ⏭️  Skipped (exists, use --force to overwrite)")
                continue
            
            # Read source
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta_data = json.load(f)
            
            # Translate titles in meta structure
            translated_meta = self._translate_meta_structure(
                meta_data,
                target_lang_config
            )
            
            # Write
            if self.dry_run:
                print(f"    [DRY RUN] Would write to: {target_meta}")
            else:
                with open(target_meta, 'w', encoding='utf-8') as f:
                    json.dump(translated_meta, f, ensure_ascii=False, indent=2)
                print(f"    ✅ Created {target_meta.name}")
        
        return True
    
    def _translate_meta_structure(self, meta_data: Any, target_lang_config: Dict) -> Any:
        """Recursively translate meta.json structure (titles only)."""
        
        if isinstance(meta_data, dict):
            translated = {}
            for key, value in meta_data.items():
                # Translate 'title' fields
                if key == "title" and isinstance(value, str):
                    print(f"      → Translating: {value}")
                    translated[key] = self.translator.translate_short(
                        value,
                        target_lang_config,
                        context="navigation title"
                    )
                else:
                    translated[key] = self._translate_meta_structure(value, target_lang_config)
            return translated
        
        elif isinstance(meta_data, list):
            return [self._translate_meta_structure(item, target_lang_config) for item in meta_data]
        
        else:
            return meta_data


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Translate ProfeVision documentation (MDX files) to target languages"
    )
    parser.add_argument(
        "--lang",
        type=str,
        help="Target language code(s) (comma-separated, e.g., 'de' or 'de,it')"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview translations without writing files"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing translations"
    )
    
    args = parser.parse_args()
    
    # Load languages config
    config_loader = ConfigLoader()
    languages_config = config_loader.load_languages_config()
    
    # Determine target languages
    if args.lang:
        target_langs = [lang.strip() for lang in args.lang.split(",")]
    else:
        # Get all enabled languages
        target_langs = [
            code for code, info in languages_config['languages'].items()
            if info.get('enabled', False) and code != SOURCE_LANGUAGE
        ]
    
    if not target_langs:
        print("❌ No target languages specified or enabled.")
        print("\nEnable languages in config/languages.yaml or use --lang flag")
        sys.exit(1)
    
    print(f"\n🌍 Target languages: {', '.join(target_langs)}")
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No files will be written\n")
    
    # Create engine
    engine = DocsTranslationEngine(dry_run=args.dry_run, force=args.force)
    
    # Process each language
    overall_stats = {}
    
    for lang_code in target_langs:
        try:
            # Translate MDX content files
            stats = engine.translate_language(lang_code)
            overall_stats[lang_code] = stats
            
            # Translate meta.json files
            engine.translate_meta_json(lang_code)
            
            # Summary
            print(f"\n{'─' * 63}")
            print(f"✅ {lang_code.upper()}: {stats['success']}/{stats['total']} files successful")
            if stats['skipped'] > 0:
                print(f"   ⏭️  Skipped: {stats['skipped']}")
            if stats['failed'] > 0:
                print(f"   ❌ Failed: {stats['failed']}")
            
        except FileNotFoundError as e:
            print(f"\n❌ {lang_code.upper()}: {e}")
            overall_stats[lang_code] = {"error": str(e)}
        except Exception as e:
            print(f"\n❌ {lang_code.upper()}: Unexpected error: {e}")
            overall_stats[lang_code] = {"error": str(e)}
    
    # Final summary
    print(f"\n{'═' * 63}")
    print(f"📊 Translation Complete")
    print(f"{'═' * 63}")
    
    for lang, stats in overall_stats.items():
        if "error" in stats:
            print(f"  ❌ {lang.upper()}: {stats['error']}")
        else:
            print(f"  ✅ {lang.upper()}: {stats['success']}/{stats['total']} successful")
    
    print()


if __name__ == "__main__":
    main()
