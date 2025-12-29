#!/usr/bin/env python3
"""
Batch Translation Script for ProfeVision
Translate UI/API JSON + Docs MDX files for multiple languages in one command.

Usage:
    python batch-translate.py                    # Translate all enabled languages
    python batch-translate.py --lang de,it       # Translate specific languages
    python batch-translate.py --ui-only          # Only UI/API translations
    python batch-translate.py --docs-only        # Only docs translations
    python batch-translate.py --validate         # Run validation after translation
    python batch-translate.py --dry-run          # Preview without writing files
"""

import argparse
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

try:
    import yaml
except ImportError:
    print("❌ Error: PyYAML not installed. Run: pip install pyyaml")
    sys.exit(1)


# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR = Path(__file__).parent
CONFIG_DIR = SCRIPT_DIR.parent / "config"


# =============================================================================
# BATCH TRANSLATOR
# =============================================================================

class BatchTranslator:
    """Orchestrate batch translation of multiple languages."""
    
    def __init__(
        self,
        languages: List[str],
        ui_only: bool = False,
        docs_only: bool = False,
        validate: bool = False,
        dry_run: bool = False,
        force: bool = False
    ):
        self.languages = languages
        self.ui_only = ui_only
        self.docs_only = docs_only
        self.validate = validate
        self.dry_run = dry_run
        self.force = force
        
        self.results = {}
    
    def run(self) -> Dict[str, Any]:
        """Run batch translation."""
        
        print(f"\n{'═' * 63}")
        print(f"🚀 Batch Translation - ProfeVision")
        print(f"{'═' * 63}")
        print(f"Languages: {', '.join([lang.upper() for lang in self.languages])}")
        print(f"Mode: {'UI Only' if self.ui_only else 'Docs Only' if self.docs_only else 'Full (UI + Docs)'}")
        print(f"Validation: {'Enabled' if self.validate else 'Disabled'}")
        print(f"Dry Run: {'Yes' if self.dry_run else 'No'}")
        print(f"{'═' * 63}\n")
        
        start_time = datetime.now()
        
        for lang in self.languages:
            print(f"\n{'─' * 63}")
            print(f"🌍 Processing {lang.upper()}")
            print(f"{'─' * 63}\n")
            
            lang_result = {
                "ui": None,
                "docs": None,
                "validation": None,
                "success": True
            }
            
            # 1. Translate UI/API
            if not self.docs_only:
                print(f"📝 Step 1/{'3' if self.validate else '2'}: Translating UI/API files...")
                ui_success = self._run_ui_translation(lang)
                lang_result["ui"] = ui_success
                
                if not ui_success:
                    lang_result["success"] = False
                    print(f"❌ UI translation failed for {lang.upper()}")
            
            # 2. Translate Docs
            if not self.ui_only:
                print(f"\n📚 Step {'2' if not self.docs_only else '1'}/{'3' if self.validate else '2'}: Translating documentation...")
                docs_success = self._run_docs_translation(lang)
                lang_result["docs"] = docs_success
                
                if not docs_success:
                    lang_result["success"] = False
                    print(f"❌ Docs translation failed for {lang.upper()}")
            
            # 3. Validate (if enabled)
            if self.validate and not self.dry_run:
                print(f"\n🔍 Step 3/3: Validating translations...")
                validation_success = self._run_validation(lang)
                lang_result["validation"] = validation_success
                
                if not validation_success:
                    lang_result["success"] = False
                    print(f"⚠️  Validation found issues for {lang.upper()}")
            
            self.results[lang] = lang_result
            
            # Summary for this language
            self._print_language_summary(lang, lang_result)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Final summary
        self._print_final_summary(duration)
        
        return self.results
    
    def _run_ui_translation(self, lang: str) -> bool:
        """Run translate-ui.py for a language."""
        
        cmd = [
            sys.executable,
            str(SCRIPT_DIR / "translate-ui.py"),
            "--lang", lang
        ]
        
        if self.dry_run:
            cmd.append("--dry-run")
        
        if self.force:
            cmd.append("--force")
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=False,  # Show output in real-time
                check=True
            )
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Error running translate-ui.py: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def _run_docs_translation(self, lang: str) -> bool:
        """Run translate-docs.py for a language."""
        
        cmd = [
            sys.executable,
            str(SCRIPT_DIR / "translate-docs.py"),
            "--lang", lang
        ]
        
        if self.dry_run:
            cmd.append("--dry-run")
        
        if self.force:
            cmd.append("--force")
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=False,  # Show output in real-time
                check=True
            )
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Error running translate-docs.py: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def _run_validation(self, lang: str) -> bool:
        """Run validate.py for a language."""
        
        cmd = [
            sys.executable,
            str(SCRIPT_DIR / "validate.py"),
            "--lang", lang
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=False,  # Show output in real-time
                check=False  # Don't fail on validation errors
            )
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Error running validate.py: {e}")
            return False
    
    def _print_language_summary(self, lang: str, result: Dict[str, Any]):
        """Print summary for a single language."""
        
        print(f"\n{'─' * 63}")
        print(f"📊 {lang.upper()} Summary:")
        
        if result["ui"] is not None:
            status = "✅" if result["ui"] else "❌"
            print(f"  {status} UI/API Translation")
        
        if result["docs"] is not None:
            status = "✅" if result["docs"] else "❌"
            print(f"  {status} Documentation Translation")
        
        if result["validation"] is not None:
            status = "✅" if result["validation"] else "⚠️ "
            print(f"  {status} Validation")
        
        overall = "✅ SUCCESS" if result["success"] else "❌ FAILED"
        print(f"\n  {overall}")
        print(f"{'─' * 63}")
    
    def _print_final_summary(self, duration: float):
        """Print final summary for all languages."""
        
        print(f"\n{'═' * 63}")
        print(f"🏁 Batch Translation Complete")
        print(f"{'═' * 63}")
        
        successful = sum(1 for r in self.results.values() if r["success"])
        failed = len(self.results) - successful
        
        print(f"\nResults:")
        for lang, result in self.results.items():
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {lang.upper()}")
        
        print(f"\nSummary:")
        print(f"  Total languages: {len(self.results)}")
        print(f"  Successful: {successful}")
        print(f"  Failed: {failed}")
        print(f"  Duration: {duration:.1f}s ({duration/60:.1f} mins)")
        
        if self.dry_run:
            print(f"\n  ℹ️  DRY RUN - No files were written")
        
        print(f"\n{'═' * 63}\n")


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Batch translate ProfeVision to multiple languages"
    )
    parser.add_argument(
        "--lang",
        type=str,
        help="Target language code(s) (comma-separated, e.g., 'de,it,zh'). If not specified, all enabled languages will be processed."
    )
    parser.add_argument(
        "--ui-only",
        action="store_true",
        help="Only translate UI/API JSON files"
    )
    parser.add_argument(
        "--docs-only",
        action="store_true",
        help="Only translate documentation MDX files"
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Run validation after translation"
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
    
    # Validate mutually exclusive options
    if args.ui_only and args.docs_only:
        print("❌ Error: --ui-only and --docs-only are mutually exclusive")
        sys.exit(1)
    
    # Load languages config
    config_file = CONFIG_DIR / "languages.yaml"
    if not config_file.exists():
        print(f"❌ Error: Languages config not found: {config_file}")
        sys.exit(1)
    
    with open(config_file, 'r', encoding='utf-8') as f:
        languages_config = yaml.safe_load(f)
    
    source_language = languages_config.get('source_language', 'es')
    
    # Determine target languages
    if args.lang:
        target_langs = [lang.strip() for lang in args.lang.split(",")]
    else:
        # Get all enabled languages
        target_langs = [
            code for code, info in languages_config['languages'].items()
            if info.get('enabled', False) and code != source_language
        ]
    
    if not target_langs:
        print("❌ No target languages specified or enabled.")
        print("\nEnable languages in config/languages.yaml or use --lang flag")
        sys.exit(1)
    
    # Create batch translator
    translator = BatchTranslator(
        languages=target_langs,
        ui_only=args.ui_only,
        docs_only=args.docs_only,
        validate=args.validate,
        dry_run=args.dry_run,
        force=args.force
    )
    
    # Run
    results = translator.run()
    
    # Exit code: 0 if all succeeded, 1 if any failed
    all_success = all(r["success"] for r in results.values())
    sys.exit(0 if all_success else 1)


if __name__ == "__main__":
    main()
