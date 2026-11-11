#!/usr/bin/env python3
"""Generate lib/zve10/presets.json from AlphaTone XML and embedded presets.py."""
import json
import sys
from pathlib import Path
import zipfile

# Add Python app to path
PYTHON_APP = Path("/home/thaikpham/Downloads/ZVE10_DAT_DECODE/SonyRecallColor")
sys.path.insert(0, str(PYTHON_APP))

import presets

HERE = Path(__file__).resolve().parent.parent
OUT = HERE / "lib" / "zve10" / "presets.json"

# Collect all presets from AlphaTone ZIP (if it exists) and embedded XML files
all_recipes = []

# Try AlphaTone-COLORLAB.zip
collections_dir = PYTHON_APP.parent / "Collections"
colorlab_zip = collections_dir / "AlphaTone-COLORLAB.zip"

if colorlab_zip.exists():
    with zipfile.ZipFile(colorlab_zip) as z:
        for info in z.infolist():
            if info.filename.lower().endswith(".xml") and not info.is_dir():
                try:
                    content = z.read(info)
                    result = presets.read_preset(content, info.filename)
                    if result:
                        all_recipes.append(result)
                except Exception as e:
                    print(f"Skipped {info.filename}: {e}", file=sys.stderr)

# Import from embedded presets XML directory
presets_dir = PYTHON_APP / "presets"
if presets_dir.exists():
    for xml_file in presets_dir.glob("*.xml"):
        try:
            content = xml_file.read_bytes()
            result = presets.read_preset(content, xml_file.name)
            if result:
                # Check for duplicate by name + hash
                existing_id = next((r["id"] for r in all_recipes if r["name"] == result["name"]), None)
                if not existing_id:
                    all_recipes.append(result)
        except Exception as e:
            print(f"Skipped {xml_file.name}: {e}", file=sys.stderr)

# Filter out unsupported recipes (S-Cinetone, etc.)
# Only keep recipes marked compatible (no unsupported list or empty)
supported = [r for r in all_recipes if not r.get("unsupported", [])]

# Normalize output format: keep only the essential fields
output = []
for recipe in supported:
    entry = {
        "id": recipe["id"],
        "name": recipe["name"],
        "group": recipe["group"],
        "description_vi": recipe["description"],
        "description_en": recipe.get("source", ""),
        "wb": recipe["wb"],
        "pp": recipe["pp"],
    }
    output.append(entry)

# Write output
OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open("w") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Generated {len(output)} compatible presets to {OUT}")
