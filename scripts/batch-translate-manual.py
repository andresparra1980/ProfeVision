#!/usr/bin/env python3
"""
Manual Batch Translation Processor for ProfeVision
Prepares translation batches to be processed via Claude web interface
Outputs formatted JSON + prompts for efficient batch translation
"""

import json
from pathlib import Path
from typing import Dict, Any

LOCALES_DIR = Path("apps/web/i18n/locales")
API_DIR = Path("apps/web/i18n/api/locales")


def create_translation_batch(files: list[Path], category: str, batch_num: int) -> str:
    """Create a single translation batch with all file contents"""
    
    batch_data = {}
    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            batch_data[file_path.name] = json.load(f)
    
    return json.dumps(batch_data, ensure_ascii=False, indent=2)


def create_translation_prompt(files_list: list[str], target_lang: str, content: str) -> str:
    """Create a Claude-friendly translation prompt"""
    
    lang_info = {
        'fr': {
            'name': 'French',
            'native': 'Français',
            'context': 'ProfeVisión is an educational platform for managing exams and student grading'
        },
        'pt': {
            'name': 'Brazilian Portuguese',
            'native': 'Português (Brasil)',
            'context': 'ProfeVisión is an educational platform for managing exams and student grading'
        }
    }
    
    info = lang_info[target_lang]
    files_str = '\n'.join([f'  - {f}' for f in files_list])
    
    prompt = f"""You are a professional translator specializing in educational software localization.

TASK: Translate the following JSON files from Spanish to {info['name']} ({info['native']})

FILES TO TRANSLATE:
{files_str}

CONTEXT: {info['context']}

INSTRUCTIONS:
1. Preserve ALL JSON structure exactly - only translate text values
2. Keep all keys unchanged
3. Maintain formatting and indentation
4. Preserve placeholders: {{name}}, {{count}}, {{number}}, etc.
5. Keep brand names unchanged: "ProfeVisión", "ProfeVision", "OMR", etc.
6. For technical terms, use professional terminology in target language
7. Do NOT translate URLs, paths, or identifiers
8. Preserve HTML entities and special characters
9. Return ONLY valid JSON wrapped in a JSON code block

JSON CONTENT TO TRANSLATE:
```json
{content}
```

OUTPUT: Return the translated JSON (same structure, different language values only):"""
    
    return prompt


def main():
    print("\n📦 ProfeVision Batch Translation Processor")
    print("=" * 70)
    
    # Get all files
    ui_files = sorted(list((LOCALES_DIR / "es").glob("*.json")))
    api_files = sorted(list((API_DIR / "es").glob("*.json")))
    
    # Split into manageable batches (max 3 files per batch to avoid token limits)
    BATCH_SIZE = 3
    
    batches = {
        'ui': [],
        'api': []
    }
    
    # Create UI batches
    for i in range(0, len(ui_files), BATCH_SIZE):
        batch_files = ui_files[i:i+BATCH_SIZE]
        batches['ui'].append(batch_files)
    
    # Create API batches
    for i in range(0, len(api_files), BATCH_SIZE):
        batch_files = api_files[i:i+BATCH_SIZE]
        batches['api'].append(batch_files)
    
    print(f"\n✅ Created {len(batches['ui'])} UI batches ({len(ui_files)} files)")
    print(f"✅ Created {len(batches['api'])} API batches ({len(api_files)} files)")
    
    # Process batches
    output_dir = Path("translation-batches")
    output_dir.mkdir(exist_ok=True)
    
    batch_count = 0
    
    # UI Batches
    for batch_idx, batch_files in enumerate(batches['ui'], 1):
        for target_lang in ['fr', 'pt']:
            batch_count += 1
            
            # Read all files in batch
            combined_json = {}
            file_names = []
            for file_path in batch_files:
                with open(file_path, 'r', encoding='utf-8') as f:
                    combined_json[file_path.stem] = json.load(f)
                file_names.append(file_path.name)
            
            # Create files
            content = json.dumps(combined_json, ensure_ascii=False, indent=2)
            prompt = create_translation_prompt(file_names, target_lang, content)
            
            # Save batch info
            batch_name = f"batch-ui-{batch_idx:02d}-{target_lang}"
            
            with open(output_dir / f"{batch_name}-prompt.txt", 'w', encoding='utf-8') as f:
                f.write(prompt)
            
            with open(output_dir / f"{batch_name}-content.json", 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"\n📄 {batch_name}")
            print(f"   Files: {', '.join([f.name for f in batch_files])}")
            print(f"   Content: {len(content)} chars")
            print(f"   Prompt: {len(prompt)} chars")
    
    # API Batches
    for batch_idx, batch_files in enumerate(batches['api'], 1):
        for target_lang in ['fr', 'pt']:
            batch_count += 1
            
            # Read all files in batch
            combined_json = {}
            file_names = []
            for file_path in batch_files:
                with open(file_path, 'r', encoding='utf-8') as f:
                    combined_json[file_path.stem] = json.load(f)
                file_names.append(file_path.name)
            
            # Create files
            content = json.dumps(combined_json, ensure_ascii=False, indent=2)
            prompt = create_translation_prompt(file_names, target_lang, content)
            
            # Save batch info
            batch_name = f"batch-api-{batch_idx:02d}-{target_lang}"
            
            with open(output_dir / f"{batch_name}-prompt.txt", 'w', encoding='utf-8') as f:
                f.write(prompt)
            
            with open(output_dir / f"{batch_name}-content.json", 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"\n📄 {batch_name}")
            print(f"   Files: {', '.join([f.name for f in batch_files])}")
            print(f"   Content: {len(content)} chars")
            print(f"   Prompt: {len(prompt)} chars")
    
    print(f"\n{'='*70}")
    print(f"✅ Created {batch_count} translation batches")
    print(f"📁 Output directory: {output_dir}")
    print(f"\nNEXT STEPS:")
    print(f"1. Open each -prompt.txt file")
    print(f"2. Paste into Claude web interface")
    print(f"3. Copy the translated JSON response")
    print(f"4. Save to corresponding locale directory")
    print(f"5. Use process-translations.py to finalize")


if __name__ == "__main__":
    main()
