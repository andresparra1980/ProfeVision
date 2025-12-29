#!/usr/bin/env python3
"""
Generic UI/API Translation Script for ProfeVision
Translates JSON files from Spanish to any target language using configurable prompts.

Usage:
    python translate-ui.py                    # Translate all enabled languages
    python translate-ui.py --lang fr          # Translate only French
    python translate-ui.py --lang fr,pt       # Translate French and Portuguese
    python translate-ui.py --dry-run          # Preview without writing files
    python translate-ui.py --force            # Overwrite existing translations
"""

import argparse
import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional
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
LOCALES_DIR = PROJECT_ROOT / "apps" / "web" / "i18n" / "locales"
API_LOCALES_DIR = PROJECT_ROOT / "apps" / "web" / "i18n" / "api" / "locales"

SOURCE_LANGUAGE = "es"


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
# PROMPT BUILDER
# =============================================================================

class PromptBuilder:
    """Build translation prompts from templates and configs."""
    
    @staticmethod
    def build_ui_prompt(
        json_content: str,
        source_lang: str,
        target_lang_config: Dict,
        file_name: str
    ) -> str:
        """Build prompt for UI/API JSON translation."""
        
        # Load template
        template = ConfigLoader.load_prompt_template("ui-translations")
        
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
        prompt = prompt.replace("{{JSON_CONTENT}}", json_content)
        
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
            
            # Clean up markdown code blocks if present
            if translated_content.startswith("```json"):
                translated_content = translated_content[7:]
            if translated_content.startswith("```"):
                translated_content = translated_content[3:]
            if translated_content.endswith("```"):
                translated_content = translated_content[:-3]
            
            translated_content = translated_content.strip()
            
            # Rate limiting
            time.sleep(self.rate_limit_delay)
            
            return translated_content
            
        except subprocess.CalledProcessError as e:
            raise ValueError(f"Curl error: {e.stderr}")
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON decode error: {e}")
        except Exception as e:
            raise ValueError(f"Translation error: {str(e)}")


# =============================================================================
# VALIDATOR
# =============================================================================

class Validator:
    """Validate translated JSON against source."""
    
    @staticmethod
    def validate_structure(
        source_json: Dict,
        translated_json: Dict,
        path: str = ""
    ) -> tuple[bool, List[str]]:
        """Validate that translated JSON has same structure as source."""
        errors = []
        
        if type(source_json) != type(translated_json):
            errors.append(f"Type mismatch at {path}: {type(source_json).__name__} vs {type(translated_json).__name__}")
            return False, errors
        
        if isinstance(source_json, dict):
            source_keys = set(source_json.keys())
            translated_keys = set(translated_json.keys())
            
            missing = source_keys - translated_keys
            extra = translated_keys - source_keys
            
            if missing:
                errors.append(f"Missing keys at {path}: {missing}")
            if extra:
                errors.append(f"Extra keys at {path}: {extra}")
            
            if missing or extra:
                return False, errors
            
            for key in source_keys:
                new_path = f"{path}.{key}" if path else key
                valid, sub_errors = Validator.validate_structure(
                    source_json[key],
                    translated_json[key],
                    new_path
                )
                if not valid:
                    errors.extend(sub_errors)
        
        elif isinstance(source_json, list):
            if len(source_json) != len(translated_json):
                errors.append(f"List length mismatch at {path}: {len(source_json)} vs {len(translated_json)}")
                return False, errors
            
            for i, (source_item, trans_item) in enumerate(zip(source_json, translated_json)):
                new_path = f"{path}[{i}]"
                valid, sub_errors = Validator.validate_structure(
                    source_item,
                    trans_item,
                    new_path
                )
                if not valid:
                    errors.extend(sub_errors)
        
        return len(errors) == 0, errors


# =============================================================================
# TRANSLATOR ENGINE
# =============================================================================

class TranslationEngine:
    """Main translation engine coordinating all components."""
    
    def __init__(self, dry_run: bool = False, force: bool = False):
        self.dry_run = dry_run
        self.force = force
        self.config_loader = ConfigLoader()
        self.translator = Translator()
        self.validator = Validator()
    
    def translate_file(
        self,
        source_file: Path,
        target_file: Path,
        target_lang_config: Dict,
        file_name: str
    ) -> bool:
        """Translate a single JSON file."""
        
        # Read source file
        with open(source_file, 'r', encoding='utf-8') as f:
            source_content = f.read()
            source_json = json.loads(source_content)
        
        # Build prompt
        prompt = PromptBuilder.build_ui_prompt(
            source_content,
            SOURCE_LANGUAGE,
            target_lang_config,
            file_name
        )
        
        # Get translation
        translated_content = self.translator.translate(prompt)
        
        # Parse and validate
        try:
            translated_json = json.loads(translated_content)
        except json.JSONDecodeError as e:
            print(f"    ❌ Invalid JSON returned: {e}")
            return False
        
        valid, errors = self.validator.validate_structure(source_json, translated_json)
        if not valid:
            print(f"    ❌ Validation failed:")
            for error in errors[:3]:  # Show first 3 errors
                print(f"       {error}")
            return False
        
        # Write output
        if not self.dry_run:
            target_file.parent.mkdir(parents=True, exist_ok=True)
            with open(target_file, 'w', encoding='utf-8') as f:
                json.dump(translated_json, f, ensure_ascii=False, indent=2)
        
        return True
    
    def translate_directory(
        self,
        source_dir: Path,
        target_lang: str,
        target_lang_config: Dict
    ) -> tuple[int, int]:
        """Translate all JSON files in a directory."""
        
        if not source_dir.exists():
            print(f"  ⚠️  Source directory not found: {source_dir}")
            return 0, 0
        
        json_files = sorted(source_dir.glob("*.json"))
        if not json_files:
            print(f"  ⚠️  No JSON files found in {source_dir}")
            return 0, 0
        
        total = len(json_files)
        successful = 0
        
        for i, source_file in enumerate(json_files, 1):
            file_name = source_file.name
            target_dir = source_dir.parent / target_lang
            target_file = target_dir / file_name
            
            # Skip if exists and not force
            if target_file.exists() and not self.force:
                print(f"  [{i:2d}/{total}] ⏭️  {file_name:40s} (exists, use --force to overwrite)")
                successful += 1
                continue
            
            print(f"  [{i:2d}/{total}] 📝 {file_name:40s} ... ", end="", flush=True)
            
            try:
                success = self.translate_file(
                    source_file,
                    target_file,
                    target_lang_config,
                    file_name
                )
                if success:
                    status = "✓ (dry-run)" if self.dry_run else "✓"
                    print(status)
                    successful += 1
                else:
                    print("❌")
            except Exception as e:
                print(f"❌ Error: {str(e)[:50]}")
        
        return total, successful


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Translate ProfeVision UI/API JSON files to target languages",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python translate-ui.py                 # Translate all enabled languages
  python translate-ui.py --lang fr       # Translate only French
  python translate-ui.py --lang fr,pt    # Translate French and Portuguese
  python translate-ui.py --dry-run       # Preview without writing files
  python translate-ui.py --force         # Overwrite existing translations
        """
    )
    
    parser.add_argument(
        '--lang',
        help='Target language(s) to translate (comma-separated). Default: all enabled languages'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview translation without writing files'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Overwrite existing translations'
    )
    
    args = parser.parse_args()
    
    # Header
    print("\n" + "="*80)
    print("ProfeVision UI/API Translation Script")
    print("="*80)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if args.dry_run:
        print("🔍 DRY RUN MODE - No files will be written")
    if args.force:
        print("⚠️  FORCE MODE - Existing translations will be overwritten")
    print()
    
    # Load config
    try:
        config = ConfigLoader.load_languages_config()
    except FileNotFoundError as e:
        print(f"❌ {e}")
        return 1
    
    # Determine target languages
    if args.lang:
        target_langs = [lang.strip() for lang in args.lang.split(',')]
    else:
        # Get all enabled languages
        target_langs = [
            lang_code
            for lang_code, lang_info in config['languages'].items()
            if lang_info.get('enabled', False)
        ]
    
    if not target_langs:
        print("❌ No target languages specified or enabled in config")
        print("   Edit config/languages.yaml to enable languages")
        return 1
    
    print(f"🌍 Target languages: {', '.join(target_langs)}")
    print()
    
    # Initialize engine
    engine = TranslationEngine(dry_run=args.dry_run, force=args.force)
    
    # Translate each language
    total_files = 0
    total_successful = 0
    
    for lang_code in target_langs:
        print(f"{'='*80}")
        print(f"Translating to {lang_code.upper()}")
        print(f"{'='*80}")
        
        # Load language config
        try:
            lang_config = ConfigLoader.load_language_prompt(lang_code)
        except FileNotFoundError as e:
            print(f"❌ {e}")
            continue
        
        # Translate UI locales
        print(f"\n📂 UI Translations (locales/{lang_code}/):")
        source_dir = LOCALES_DIR / SOURCE_LANGUAGE
        ui_total, ui_successful = engine.translate_directory(
            source_dir,
            lang_code,
            lang_config
        )
        
        # Translate API locales
        print(f"\n📂 API Translations (api/locales/{lang_code}/):")
        api_source_dir = API_LOCALES_DIR / SOURCE_LANGUAGE
        api_total, api_successful = engine.translate_directory(
            api_source_dir,
            lang_code,
            lang_config
        )
        
        lang_total = ui_total + api_total
        lang_successful = ui_successful + api_successful
        total_files += lang_total
        total_successful += lang_successful
        
        print(f"\n✅ {lang_code.upper()}: {lang_successful}/{lang_total} files successful")
        print()
    
    # Summary
    print("="*80)
    print("Translation Summary")
    print("="*80)
    print(f"Total files processed: {total_successful}/{total_files}")
    
    if total_successful == total_files:
        print("✅ All translations completed successfully!")
        return 0
    else:
        failed = total_files - total_successful
        print(f"⚠️  {failed} translation(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
