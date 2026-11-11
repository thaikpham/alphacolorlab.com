#!/usr/bin/env python3
"""Generate golden DAT files from real Dot6 samples for TS parity tests."""
import json
import sys
from pathlib import Path

PYTHON_APP = Path("/home/thaikpham/Downloads/ZVE10_DAT_DECODE/SonyRecallColor")
sys.path.insert(0, str(PYTHON_APP))

import zve10_dat as dat

HERE = Path(__file__).resolve().parent.parent
OUT = HERE / "test" / "fixtures" / "golden"
DOT6_SRC = PYTHON_APP.parent / "DatResearch" / "DAT Sample" / "E10" / "Dot6"

OUT.mkdir(parents=True, exist_ok=True)

# Load the bundled profile to decode what's in Dot6 samples
with open(HERE / "lib" / "zve10" / "profile.json") as f:
    profile_data = json.load(f)
    profile = dat.with_supplement(profile_data["profile"], profile_data.get("supplement"))

cases = {}
outputs = []

# Copy real Dot6 files as golden references (they are guaranteed valid)
dot6_files = sorted(DOT6_SRC.glob("CAMPR*.DAT"))

for i, dat_file in enumerate(dot6_files, 1):
    data = dat_file.read_bytes()

    # Parse and decode
    info = dat.parse(data)
    decoded = dat.decode_settings(data, profile)

    # Copy to golden
    out_name = f"case_0{i}_dot6_{dat_file.stem.lower()}.DAT"
    (OUT / out_name).write_bytes(data)
    outputs.append(out_name)

    # Document what's in this file
    cases[f"case_0{i}_dot6_{dat_file.stem.lower()}"] = {
        "source": "Dot6",
        "file": dat_file.name,
        "decoded": {
            "slot": info["slot"],
            "family": info["family"],
            "mode": decoded["mode"],
            "exposure": decoded["exposure"],
            "wb": decoded["wb"],
            "pp_selected": decoded["pp_selected"],
            "focus": decoded["focus"]
        }
    }

# Document hypothetical test cases for TS to implement
# (these are not actual golden files, just test scenarios)
cases["case_05_slot_rename_4to1"] = {
    "description": "Rename CAMPR04N.DAT to slot 1 with fixed date",
    "input_base": dot6_files[3].name if len(dot6_files) >= 4 else "CAMPR04N.DAT",
    "target_slot": 1,
    "target_date": "20261028_223900",
    "settings": {"mode": "keep", "wb": "keep", "pp": "keep", "focus": "keep"}
}

cases["case_06_focus_MF"] = {
    "description": "Slot 1 with focus MF",
    "input_base": "CAMPR01N.DAT",
    "target_slot": 1,
    "settings": {"focus": "MF", "mode": "keep", "wb": "keep", "pp": "keep"}
}

cases["case_07_focus_AF_S"] = {
    "description": "Slot 2 with focus AF-S",
    "input_base": "CAMPR02N.DAT",
    "target_slot": 2,
    "settings": {"focus": "AF-S", "mode": "keep", "wb": "keep", "pp": "keep"}
}

cases["case_08_focus_AF_C"] = {
    "description": "Slot 3 with focus AF-C",
    "input_base": "CAMPR03N.DAT",
    "target_slot": 3,
    "settings": {"focus": "AF-C", "mode": "keep", "wb": "keep", "pp": "keep"}
}

# Save cases.json
with open(OUT / "cases.json", "w") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)

print(f"Generated {len(outputs)} golden test files to {OUT}")
print(f"Documented {len(cases)} test cases in cases.json")
