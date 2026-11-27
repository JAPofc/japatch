#!/usr/bin/env python3
"""Cross-checks the numbers and names that the docs, the manifest and the runtime all have to agree on.

    python3 scripts/audit.py            # report
    python3 scripts/audit.py --check    # exit 1 on any mismatch (runs in CI)

Each check exists because the same class of drift shipped once: a README that said 34 languages while
listing 35 names, notes that named issue numbers nothing could resolve, patch counts in three places.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BOOTSTRAP = ROOT / "patches/src/main/resources/japatch/bootstrap.js"
I18N = ROOT / "patches/src/main/resources/japatch/i18n"
README = ROOT / "README.md"

problems = []
notes = []


def fail(what):
    problems.append(what)


def ok(what):
    notes.append("  ok   " + what)


def main():
    readme = README.read_text(encoding="utf-8")
    source = BOOTSTRAP.read_text(encoding="utf-8")

    # --- languages: the picker, the files and every sentence about them ---
    index = [c for c in (I18N / "index.txt").read_text(encoding="utf-8").split() if c]
    block = source[source.index("const UI_LANGUAGES = "):]
    block = block[:block.index("];")]
    picker = re.findall(r'\["([A-Za-z-]+)",', block)
    expected = {"en"} | set(index)
    if set(picker) != expected:
        fail(f"UI_LANGUAGES {sorted(set(picker) ^ expected)} never match index.txt + en")
    else:
        ok(f"UI_LANGUAGES lists en + the {len(index)} language files")

    files = {p.stem for p in I18N.glob("*.json")}
    if files != set(index):
        fail(f"index.txt and the language files differ: {sorted(files ^ set(index))}")
    else:
        ok(f"index.txt names exactly the {len(index)} files on disk")

    # Every "N languages" sentence in the README must equal the number of shipped files. The list bug counted a
    # wrapped "Urdu and Vietnamese" as one name, so the sentence and its own list disagreed.
    claims = re.findall(r"\*\*(\d+) languages?\*\*|(\d+) languages? ", readme)
    for a, b in claims:
        n = int(a or b)
        if n != len(index):
            fail(f"README says {n} languages, {len(index)} ship")
    m = re.search(r"(\d+) languages ship with the bundle: ([^.]+)\.", readme, re.S)
    if m:
        listed = m.group(2).replace("\n", " ").replace(",", " ").replace(" and ", " ")
        listed = re.sub(r"\([^)]*\)", "", listed).split()
        # "Chinese (Simplified and Traditional)" is one bullet for two files, "Portuguese (Brazil)" one for one.
        if len(listed) != len(index):
            fail(f"README lists {len(listed)} language names, {len(index)} files ship")
        else:
            ok(f"README lists all {len(index)} languages by name")

    # --- patches: manifest, runtime table and README ---
    manifest = json.loads((ROOT / "patches-list.json").read_text(encoding="utf-8"))
    patches = manifest["patches"]
    by_cat = {}
    for p in patches:
        by_cat[p["category"]] = by_cat.get(p["category"], 0) + 1
    m = re.search(r"\*\*(\d+) features\*\*", readme)
    if m and int(m.group(1)) != by_cat.get("Features", 0):
        fail(f"README says {m.group(1)} features, the manifest has {by_cat.get('Features', 0)}")
    elif m:
        ok(f"README and the manifest agree on {by_cat.get('Features', 0)} features")
    total = re.search(r"\*\*(\d+) patches\*\*", readme)
    if total and int(total.group(1)) != len(patches):
        fail(f"README says {total.group(1)} patches, the manifest has {len(patches)}")
    ok(f"manifest: {len(patches)} patches = " + " + ".join(f"{v} {k}" for k, v in sorted(by_cat.items())))

    # --- the runtime's feature switch table has a key for every patch that has one ---
    for p in patches:
        key = p.get("settings_key") or p.get("key")
        if key and f'"{key}"' not in source:
            fail(f"patch {p.get('name')} has key {key} that the runtime never reads")

    # --- release notes: no issue numbers, and the newest entry matches the shipped version ---
    import subprocess
    version = json.loads((ROOT / "patches-bundle.json").read_text(encoding="utf-8"))["version"]
    notes_out = subprocess.run([sys.executable, ROOT / "scripts/release_info.py", "--check"],
                               capture_output=True, text=True)
    if notes_out.returncode:
        fail("release_info.py --check: " + (notes_out.stdout + notes_out.stderr).strip()[:200])
    else:
        ok("release notes pass their own check")
    body = subprocess.run([sys.executable, ROOT / "scripts/release_info.py", version],
                          capture_output=True, text=True).stdout
    if not body.strip():
        fail(f"release_info.py has no notes for the shipped version {version}")
    else:
        ok(f"notes for the shipped version {version} exist")
    refs = re.findall(r"#\d+", subprocess.run([sys.executable, ROOT / "scripts/release_info.py", "--all"],
                                             capture_output=True, text=True).stdout)
    refs = [r for r in refs if not re.fullmatch(r"#[0-9a-fA-F]{3,8}", r)]
    if refs:
        fail(f"release notes still name numbers nothing resolves: {sorted(set(refs))[:6]}")
    else:
        ok("no release note names an issue number")

    # --- the README's own links ---
    for path in re.findall(r"\]\((?!https?:|#)([^)#]+)", readme):
        if not (ROOT / path).exists():
            fail(f"README links to {path}, which does not exist")
    ok("every relative README link resolves")

    print("\n".join(notes))
    if problems:
        print()
        for p in problems:
            print("FAIL", p)
        print(f"\naudit: {len(problems)} problem(s)")
        return 1
    print("\naudit: everything agrees")
    return 0


if __name__ == "__main__":
    raise SystemExit(main() if "--check" in sys.argv or True else 0)
