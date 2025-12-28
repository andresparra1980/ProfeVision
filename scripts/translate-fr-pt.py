#!/usr/bin/env python3
"""
Translation script for ProfeVision UI and API localization.
Translates Spanish JSON files to French and Portuguese (Brazilian).
Uses OpenRouter API with Google Gemini 2.5 Flash Lite for translations.
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Any, Dict
from datetime import datetime
import time

# Directories to translate
LOCALES_DIR = Path("apps/web/i18n/locales")
API_DIR = Path("apps/web/i18n/api/locales")

# Languages to translate to
TARGET_LANGUAGES = ["fr", "pt"]  # French and Portuguese (Brazilian)


def translate_json_content(spanish_json: str, target_lang: str, file_name: str) -> str:
    """
    Translate a JSON file content to target language using OpenRouter API with Gemini 2.5 Flash Lite.
    
    Args:
        spanish_json: Spanish JSON content as string
        target_lang: Target language code ('fr' or 'pt')
        file_name: Name of the file being translated (for context)
    
    Returns:
        Translated JSON as string
    """
    lang_names = {
        "fr": "French",
        "pt": "Brazilian Portuguese"
    }
    
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")
    
    prompt = f"""You are a professional translator specializing in translating user interface text for educational software.

TASK: Translate the following JSON file from Spanish to {lang_names[target_lang]} (file: {file_name}).

IMPORTANT RULES:
1. Preserve the exact JSON structure - only translate the text values
2. Keep all keys unchanged (only values change)
3. Maintain proper JSON formatting
4. Preserve placeholders like {{number}}, {{count}}, etc.
5. For technical terms, use professional educational software terminology in the target language
6. Do NOT translate paths, URLs, or identifiers
7. Keep brand names (ProfeVisión, ProfeVision) unchanged
8. Preserve HTML entities and special characters
9. Return ONLY valid JSON, no explanations or markdown

Spanish JSON to translate:
```json
{spanish_json}
```

Respond with ONLY the translated JSON (no markdown, no code blocks, just the raw JSON):"""

    # Create request body for OpenRouter
    request_body = {
        "model": "google/gemini-3-flash-preview",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    # Call OpenRouter API via curl
    curl_cmd = [
        "curl",
        "-s",
        "-X", "POST",
        "https://openrouter.ai/api/v1/chat/completions",
        "-H", f"Authorization: Bearer {api_key}",
        "-H", "content-type: application/json",
        "-d", json.dumps(request_body)
    ]
    
    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True, check=True, timeout=60)
        response = json.loads(result.stdout)
        
        if "error" in response:
            raise ValueError(f"API error: {response['error']['message']}")
        
        translated_content = response["choices"][0]["message"]["content"].strip()
        
        # Clean up if wrapped in markdown code blocks
        if translated_content.startswith("```json"):
            translated_content = translated_content[7:]
        if translated_content.startswith("```"):
            translated_content = translated_content[3:]
        if translated_content.endswith("```"):
            translated_content = translated_content[:-3]
        
        translated_content = translated_content.strip()
        
        return translated_content
        
    except subprocess.CalledProcessError as e:
        raise ValueError(f"Curl error: {e.stderr}")
    except Exception as e:
        raise ValueError(f"Translation error: {str(e)}")


def validate_json_structure(original: Dict[str, Any], translated: Dict[str, Any], path: str = "") -> bool:
    """
    Validate that translated JSON has the same structure as original.
    
    Args:
        original: Original Spanish JSON dict
        translated: Translated JSON dict
        path: Current path in the structure (for error reporting)
    
    Returns:
        True if structure matches, False otherwise
    """
    if type(original) != type(translated):
        print(f"  ❌ Type mismatch at {path}: {type(original).__name__} vs {type(translated).__name__}")
        return False
    
    if isinstance(original, dict):
        original_keys = set(original.keys())
        translated_keys = set(translated.keys())
        
        if original_keys != translated_keys:
            missing = original_keys - translated_keys
            extra = translated_keys - original_keys
            if missing:
                print(f"  ❌ Missing keys at {path}: {missing}")
            if extra:
                print(f"  ⚠️  Extra keys at {path}: {extra}")
            return False
        
        for key in original_keys:
            new_path = f"{path}.{key}" if path else key
            if not validate_json_structure(original[key], translated[key], new_path):
                return False
    
    elif isinstance(original, list):
        if len(original) != len(translated):
            print(f"  ❌ List length mismatch at {path}: {len(original)} vs {len(translated)}")
            return False
        
        for i, (orig_item, trans_item) in enumerate(zip(original, translated)):
            new_path = f"{path}[{i}]"
            if not validate_json_structure(orig_item, trans_item, new_path):
                return False
    
    return True


def translate_file(input_path: Path, output_dir: Path, target_lang: str) -> bool:
    """
    Translate a single JSON file to target language.
    
    Args:
        input_path: Path to Spanish JSON file
        output_dir: Directory to save translated file
        target_lang: Target language code
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Read Spanish file
        with open(input_path, 'r', encoding='utf-8') as f:
            spanish_content = f.read()
        
        # Parse to validate JSON
        spanish_json = json.loads(spanish_content)
        
        print(f"  📝 Translating to {target_lang.upper()}...", end=" ", flush=True)
        
        # Get translation from Claude
        translated_content = translate_json_content(
            spanish_content,
            target_lang,
            input_path.name
        )
        
        # Parse translated JSON
        translated_json = json.loads(translated_content)
        
        # Validate structure
        if not validate_json_structure(spanish_json, translated_json):
            print("❌ Structure validation failed")
            return False
        
        # Write translated file
        output_path = output_dir / input_path.name
        output_dir.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(translated_json, f, ensure_ascii=False, indent=2)
        
        print(f"✅")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def process_directory(source_dir: Path, name: str) -> tuple[int, int]:
    """
    Process all JSON files in a directory, translating to FR and PT.
    
    Args:
        source_dir: Source directory with Spanish JSON files
        name: Human-readable name for this directory (UI/API)
    
    Returns:
        Tuple of (total_files, successful_translations)
    """
    print(f"\n{'='*60}")
    print(f"Processing {name} Translation Files")
    print(f"{'='*60}")
    
    if not source_dir.exists():
        print(f"❌ Directory not found: {source_dir}")
        return 0, 0
    
    es_files = sorted(source_dir.glob("*.json"))
    
    if not es_files:
        print(f"⚠️  No JSON files found in {source_dir}")
        return 0, 0
    
    print(f"Found {len(es_files)} Spanish files to translate\n")
    
    successful = 0
    total = len(es_files)
    
    for es_file in es_files:
        print(f"📄 {es_file.name}")
        
        file_success = True
        for target_lang in TARGET_LANGUAGES:
            output_dir = source_dir.parent / target_lang
            if not translate_file(es_file, output_dir, target_lang):
                file_success = False
        
        if file_success:
            successful += 1
    
    return total, successful


def main():
    """Main entry point."""
    print("\n🌍 ProfeVision Translation Script")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("📡 Using OpenRouter API with Google Gemini 3 Flash Preview\n")
    
    # Check if running from project root
    if not LOCALES_DIR.exists() or not API_DIR.exists():
        print("❌ Error: Please run this script from the project root directory")
        print(f"   Expected to find: {LOCALES_DIR}")
        print(f"   Expected to find: {API_DIR}")
        sys.exit(1)
    
    # Create directories first
    print("Creating target language directories...")
    for target_lang in TARGET_LANGUAGES:
        (LOCALES_DIR / target_lang).mkdir(parents=True, exist_ok=True)
        (API_DIR / target_lang).mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {target_lang.upper()} directories ready")
    
    # Process UI translations
    ui_total, ui_successful = process_directory(
        LOCALES_DIR / "es",
        "UI/Dashboard"
    )
    
    # Process API translations
    api_total, api_successful = process_directory(
        API_DIR / "es",
        "API Responses"
    )
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Translation Summary")
    print(f"{'='*60}")
    print(f"UI Files:    {ui_successful}/{ui_total} successful")
    print(f"API Files:   {api_successful}/{api_total} successful")
    print(f"Total:       {ui_successful + api_successful}/{ui_total + api_total} successful")
    print(f"{'='*60}\n")
    
    if ui_successful + api_successful == ui_total + api_total:
        print("✅ All translations completed successfully!")
        return 0
    else:
        print(f"⚠️  {(ui_total + api_total) - (ui_successful + api_successful)} translations failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
