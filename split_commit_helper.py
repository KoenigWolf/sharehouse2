
import os

def write_file(path, lines):
    with open(path, 'w') as f:
        f.writelines(lines)

def read_file(path):
    with open(path, 'r') as f:
        return f.readlines()

def prepare_commit_1():
    # ja.ts: Remove lines 750-776 (1-based) -> indices 749-776
    ja_lines = read_file('src/lib/i18n/ja.ts.bak')
    # Keep 0 to 749 (line 1 to 750)
    # Then 776 to end (line 777 to end)
    # line 750 is "    events: {"
    # line 777 is "    onboarding: {"
    # We want to keep everything before line 750.
    # index 749 is line 750.
    new_ja = ja_lines[:749] + ja_lines[776:]
    write_file('src/lib/i18n/ja.ts', new_ja)

    # en.ts: Remove lines 749-775 (1-based)
    en_lines = read_file('src/lib/i18n/en.ts.bak')
    # line 749 is "    events: {"
    # line 776 is "    onboarding: {"
    # index 748 is line 749
    new_en = en_lines[:748] + en_lines[775:]
    write_file('src/lib/i18n/en.ts', new_en)

def prepare_commit_2():
    # Only remove contact
    # ja.ts: Remove lines 762-776 (1-based)
    # line 762 is "    contact: {"
    # line 777 is "    onboarding: {"
    ja_lines = read_file('src/lib/i18n/ja.ts.bak')
    new_ja = ja_lines[:761] + ja_lines[776:]
    write_file('src/lib/i18n/ja.ts', new_ja)

    # en.ts: Remove lines 761-775 (1-based)
    # line 761 is "    contact: {"
    # line 776 is "    onboarding: {"
    en_lines = read_file('src/lib/i18n/en.ts.bak')
    new_en = en_lines[:760] + en_lines[775:]
    write_file('src/lib/i18n/en.ts', new_en)

import sys
if __name__ == "__main__":
    step = sys.argv[1]
    if step == "1":
        prepare_commit_1()
    elif step == "2":
        prepare_commit_2()
