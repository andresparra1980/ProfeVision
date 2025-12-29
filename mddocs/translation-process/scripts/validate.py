#!/usr/bin/env python3
"""
Translation Validation Script for ProfeVision
Validates translated JSON files against source files for structural integrity.

Usage:
    python validate.py                    # Validate all enabled languages
    python validate.py --lang de          # Validate only German
    python validate.py --lang de,it       # Validate German and Italian
    python validate.py --verbose          # Show detailed validation output
    python validate.py --strict           # Fail on any validation warning
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple, Set
from collections import defaultdict

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
# VALIDATOR CLASSES
# =============================================================================

class StructureValidator:
    """Validate JSON structure matches between source and translation."""
    
    @staticmethod
    def validate(
        source_json: Dict,
        translated_json: Dict,
        path: str = ""
    ) -> Tuple[bool, List[str], List[str]]:
        """
        Validate structure.
        
        Returns:
            (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        if type(source_json) != type(translated_json):
            errors.append(
                f"Type mismatch at {path}: "
                f"{type(source_json).__name__} vs {type(translated_json).__name__}"
            )
            return False, errors, warnings
        
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
                return False, errors, warnings
            
            # Recurse into nested structures
            for key in source_keys:
                new_path = f"{path}.{key}" if path else key
                valid, sub_errors, sub_warnings = StructureValidator.validate(
                    source_json[key],
                    translated_json[key],
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, list):
            if len(source_json) != len(translated_json):
                errors.append(
                    f"List length mismatch at {path}: "
                    f"{len(source_json)} vs {len(translated_json)}"
                )
                return False, errors, warnings
            
            for i, (source_item, trans_item) in enumerate(zip(source_json, translated_json)):
                new_path = f"{path}[{i}]"
                valid, sub_errors, sub_warnings = StructureValidator.validate(
                    source_item,
                    trans_item,
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        return len(errors) == 0, errors, warnings


class PlaceholderValidator:
    """Validate placeholders are preserved in translations."""
    
    # Placeholder patterns
    PATTERNS = [
        r'\{\{[\w\s]+\}\}',      # {{variable}}
        r'\{[\w\s]+\}',          # {variable}
        r'%s',                   # %s
        r'%d',                   # %d
        r'%\d+\$[sd]',           # %1$s, %2$d
        r'\$t\([\'"][\w\.]+[\'"]\)',  # $t('key')
    ]
    
    @staticmethod
    def extract_placeholders(text: str) -> Set[str]:
        """Extract all placeholders from text."""
        placeholders = set()
        for pattern in PlaceholderValidator.PATTERNS:
            matches = re.findall(pattern, text)
            placeholders.update(matches)
        return placeholders
    
    @staticmethod
    def validate(
        source_json: Dict,
        translated_json: Dict,
        path: str = ""
    ) -> Tuple[List[str], List[str]]:
        """
        Validate placeholders.
        
        Returns:
            (errors, warnings)
        """
        errors = []
        warnings = []
        
        if isinstance(source_json, dict):
            for key in source_json.keys():
                new_path = f"{path}.{key}" if path else key
                sub_errors, sub_warnings = PlaceholderValidator.validate(
                    source_json[key],
                    translated_json.get(key, ""),
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, list):
            for i, source_item in enumerate(source_json):
                new_path = f"{path}[{i}]"
                trans_item = translated_json[i] if i < len(translated_json) else ""
                sub_errors, sub_warnings = PlaceholderValidator.validate(
                    source_item,
                    trans_item,
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, str) and isinstance(translated_json, str):
            # Extract placeholders
            source_placeholders = PlaceholderValidator.extract_placeholders(source_json)
            trans_placeholders = PlaceholderValidator.extract_placeholders(translated_json)
            
            missing = source_placeholders - trans_placeholders
            extra = trans_placeholders - source_placeholders
            
            if missing:
                errors.append(
                    f"Missing placeholders at {path}: {missing}\n"
                    f"  Source: {source_json[:80]}\n"
                    f"  Translation: {translated_json[:80]}"
                )
            
            if extra:
                warnings.append(
                    f"Extra placeholders at {path}: {extra}\n"
                    f"  Translation: {translated_json[:80]}"
                )
        
        return errors, warnings


class CompletenessValidator:
    """Validate translation completeness (no untranslated text)."""
    
    @staticmethod
    def validate(
        source_json: Dict,
        translated_json: Dict,
        source_lang: str,
        target_lang: str,
        path: str = ""
    ) -> Tuple[List[str], List[str]]:
        """
        Check for untranslated strings.
        
        Returns:
            (errors, warnings)
        """
        errors = []
        warnings = []
        
        if isinstance(source_json, dict):
            for key in source_json.keys():
                new_path = f"{path}.{key}" if path else key
                sub_errors, sub_warnings = CompletenessValidator.validate(
                    source_json[key],
                    translated_json.get(key, ""),
                    source_lang,
                    target_lang,
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, list):
            for i, source_item in enumerate(source_json):
                new_path = f"{path}[{i}]"
                trans_item = translated_json[i] if i < len(translated_json) else ""
                sub_errors, sub_warnings = CompletenessValidator.validate(
                    source_item,
                    trans_item,
                    source_lang,
                    target_lang,
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, str) and isinstance(translated_json, str):
            # Check if translation is identical to source (might be untranslated)
            if source_json == translated_json and len(source_json) > 3:
                # Skip if it's a brand name or technical term
                skip_terms = ["ProfeVision", "PDF", "OMR", "API", "URL", "HTML"]
                if not any(term in source_json for term in skip_terms):
                    warnings.append(
                        f"Possibly untranslated at {path}: \"{source_json[:60]}\""
                    )
            
            # Check if translation is empty
            if not translated_json.strip():
                errors.append(f"Empty translation at {path}: source was \"{source_json[:60]}\"")
        
        return errors, warnings


class HTMLEntityValidator:
    """Validate HTML entities are preserved."""
    
    HTML_ENTITIES = [
        '&nbsp;', '&mdash;', '&ndash;', '&hellip;', '&ldquo;', '&rdquo;',
        '&lsquo;', '&rsquo;', '&amp;', '&lt;', '&gt;', '&copy;', '&reg;'
    ]
    
    @staticmethod
    def extract_entities(text: str) -> Set[str]:
        """Extract HTML entities from text."""
        entities = set()
        for entity in HTMLEntityValidator.HTML_ENTITIES:
            if entity in text:
                entities.add(entity)
        return entities
    
    @staticmethod
    def validate(
        source_json: Dict,
        translated_json: Dict,
        path: str = ""
    ) -> Tuple[List[str], List[str]]:
        """Validate HTML entities preserved."""
        errors = []
        warnings = []
        
        if isinstance(source_json, dict):
            for key in source_json.keys():
                new_path = f"{path}.{key}" if path else key
                sub_errors, sub_warnings = HTMLEntityValidator.validate(
                    source_json[key],
                    translated_json.get(key, ""),
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, list):
            for i, source_item in enumerate(source_json):
                new_path = f"{path}[{i}]"
                trans_item = translated_json[i] if i < len(translated_json) else ""
                sub_errors, sub_warnings = HTMLEntityValidator.validate(
                    source_item,
                    trans_item,
                    new_path
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        
        elif isinstance(source_json, str) and isinstance(translated_json, str):
            source_entities = HTMLEntityValidator.extract_entities(source_json)
            trans_entities = HTMLEntityValidator.extract_entities(translated_json)
            
            missing = source_entities - trans_entities
            
            if missing:
                warnings.append(
                    f"Missing HTML entities at {path}: {missing}\n"
                    f"  Source: {source_json[:80]}"
                )
        
        return errors, warnings


# =============================================================================
# VALIDATION ENGINE
# =============================================================================

class ValidationEngine:
    """Main validation engine."""
    
    def __init__(self, verbose: bool = False, strict: bool = False):
        self.verbose = verbose
        self.strict = strict
    
    def validate_file(
        self,
        source_file: Path,
        target_file: Path,
        source_lang: str,
        target_lang: str
    ) -> Dict[str, Any]:
        """Validate a single translated file."""
        
        result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "checks": {}
        }
        
        # Check file exists
        if not target_file.exists():
            result["valid"] = False
            result["errors"].append(f"File not found: {target_file}")
            return result
        
        # Load JSON files
        try:
            with open(source_file, 'r', encoding='utf-8') as f:
                source_json = json.load(f)
        except Exception as e:
            result["valid"] = False
            result["errors"].append(f"Error loading source file: {e}")
            return result
        
        try:
            with open(target_file, 'r', encoding='utf-8') as f:
                target_json = json.load(f)
        except Exception as e:
            result["valid"] = False
            result["errors"].append(f"Error loading target file: {e}")
            return result
        
        # 1. Structure validation
        valid, errors, warnings = StructureValidator.validate(source_json, target_json)
        result["checks"]["structure"] = {
            "valid": valid,
            "errors": errors,
            "warnings": warnings
        }
        result["errors"].extend(errors)
        result["warnings"].extend(warnings)
        if not valid:
            result["valid"] = False
        
        # 2. Placeholder validation
        errors, warnings = PlaceholderValidator.validate(source_json, target_json)
        result["checks"]["placeholders"] = {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
        result["errors"].extend(errors)
        result["warnings"].extend(warnings)
        if errors:
            result["valid"] = False
        
        # 3. Completeness validation
        errors, warnings = CompletenessValidator.validate(
            source_json, target_json, source_lang, target_lang
        )
        result["checks"]["completeness"] = {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
        result["errors"].extend(errors)
        result["warnings"].extend(warnings)
        if errors:
            result["valid"] = False
        
        # 4. HTML entities validation
        errors, warnings = HTMLEntityValidator.validate(source_json, target_json)
        result["checks"]["html_entities"] = {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
        result["errors"].extend(errors)
        result["warnings"].extend(warnings)
        
        # Strict mode: warnings = errors
        if self.strict and result["warnings"]:
            result["valid"] = False
        
        return result
    
    def validate_language(self, lang_code: str) -> Dict[str, Any]:
        """Validate all translations for a language."""
        
        stats = {
            "total_files": 0,
            "valid_files": 0,
            "files_with_errors": 0,
            "files_with_warnings": 0,
            "total_errors": 0,
            "total_warnings": 0,
            "file_results": {}
        }
        
        print(f"\n{'═' * 63}")
        print(f"🔍 Validating {lang_code.upper()} translations")
        print(f"{'═' * 63}\n")
        
        # UI files
        print("📂 UI Translations (locales/):\n")
        ui_source_dir = LOCALES_DIR / SOURCE_LANGUAGE
        ui_target_dir = LOCALES_DIR / lang_code
        
        if ui_source_dir.exists() and ui_target_dir.exists():
            ui_files = list(ui_source_dir.glob("*.json"))
            stats["total_files"] += len(ui_files)
            
            for i, source_file in enumerate(ui_files, 1):
                target_file = ui_target_dir / source_file.name
                
                print(f"  [{i}/{len(ui_files)}] 📝 {source_file.name} ", end="")
                
                result = self.validate_file(
                    source_file, target_file, SOURCE_LANGUAGE, lang_code
                )
                
                stats["file_results"][f"ui/{source_file.name}"] = result
                
                if result["valid"]:
                    print("✓")
                    stats["valid_files"] += 1
                else:
                    print("✗")
                    stats["files_with_errors"] += 1
                
                stats["total_errors"] += len(result["errors"])
                stats["total_warnings"] += len(result["warnings"])
                
                if result["warnings"] and not result["errors"]:
                    stats["files_with_warnings"] += 1
                
                # Show details in verbose mode
                if self.verbose and (result["errors"] or result["warnings"]):
                    for error in result["errors"]:
                        print(f"      ❌ {error}")
                    for warning in result["warnings"]:
                        print(f"      ⚠️  {warning}")
        
        # API files
        print("\n📂 API Translations (api/locales/):\n")
        api_source_dir = API_LOCALES_DIR / SOURCE_LANGUAGE
        api_target_dir = API_LOCALES_DIR / lang_code
        
        if api_source_dir.exists() and api_target_dir.exists():
            api_files = list(api_source_dir.glob("*.json"))
            stats["total_files"] += len(api_files)
            
            for i, source_file in enumerate(api_files, 1):
                target_file = api_target_dir / source_file.name
                
                print(f"  [{i}/{len(api_files)}] 📝 {source_file.name} ", end="")
                
                result = self.validate_file(
                    source_file, target_file, SOURCE_LANGUAGE, lang_code
                )
                
                stats["file_results"][f"api/{source_file.name}"] = result
                
                if result["valid"]:
                    print("✓")
                    stats["valid_files"] += 1
                else:
                    print("✗")
                    stats["files_with_errors"] += 1
                
                stats["total_errors"] += len(result["errors"])
                stats["total_warnings"] += len(result["warnings"])
                
                if result["warnings"] and not result["errors"]:
                    stats["files_with_warnings"] += 1
                
                # Show details in verbose mode
                if self.verbose and (result["errors"] or result["warnings"]):
                    for error in result["errors"]:
                        print(f"      ❌ {error}")
                    for warning in result["warnings"]:
                        print(f"      ⚠️  {warning}")
        
        return stats


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Validate ProfeVision translations"
    )
    parser.add_argument(
        "--lang",
        type=str,
        help="Target language code(s) (comma-separated, e.g., 'de' or 'de,it')"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed validation output"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors"
    )
    
    args = parser.parse_args()
    
    # Load languages config
    config_file = CONFIG_DIR / "languages.yaml"
    with open(config_file, 'r', encoding='utf-8') as f:
        languages_config = yaml.safe_load(f)
    
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
    
    print(f"\n🌍 Validating languages: {', '.join(target_langs)}")
    
    if args.strict:
        print("🔒 STRICT MODE - Warnings will be treated as errors")
    
    # Create engine
    engine = ValidationEngine(verbose=args.verbose, strict=args.strict)
    
    # Validate each language
    overall_stats = {}
    
    for lang_code in target_langs:
        stats = engine.validate_language(lang_code)
        overall_stats[lang_code] = stats
        
        # Summary
        print(f"\n{'─' * 63}")
        print(f"📊 {lang_code.upper()} Summary:")
        print(f"  Files: {stats['valid_files']}/{stats['total_files']} valid")
        if stats['files_with_errors'] > 0:
            print(f"  ❌ Errors: {stats['total_errors']} across {stats['files_with_errors']} files")
        if stats['files_with_warnings'] > 0:
            print(f"  ⚠️  Warnings: {stats['total_warnings']} across {stats['files_with_warnings']} files")
        
        if stats['valid_files'] == stats['total_files'] and stats['total_warnings'] == 0:
            print(f"  ✅ All checks passed!")
    
    # Final summary
    print(f"\n{'═' * 63}")
    print(f"🏁 Validation Complete")
    print(f"{'═' * 63}")
    
    all_valid = True
    for lang, stats in overall_stats.items():
        status = "✅" if stats['valid_files'] == stats['total_files'] else "❌"
        print(f"  {status} {lang.upper()}: {stats['valid_files']}/{stats['total_files']} valid")
        if stats['valid_files'] != stats['total_files']:
            all_valid = False
    
    print()
    
    # Exit code
    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()
