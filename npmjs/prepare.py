import re
import json
import subprocess


llvm_version_raw = subprocess.check_output([
    "git", "-C", "../llvm-src", "describe", "--tags", "HEAD"
], encoding="utf-8").strip()
print(llvm_version_raw)

git_rev_list_raw = subprocess.check_output([
    "git", "rev-list", "HEAD"
], encoding="utf-8").split()

llvm_version = re.match(r"^llvmorg-(\d+)(?:\.(\d+)\.(\d+)(-rc\d+)?|-init-(.+)-g)?", llvm_version_raw)
llvm_major   = int(llvm_version[1])
llvm_minor   = int(llvm_version[2] or "0")
llvm_patch   = int(llvm_version[3] or "0")
if not llvm_version[5]:
    llvm_suffix = llvm_version[4] or ""
else:
    llvm_suffix = f"-git{llvm_version[5]}"

distance = len(git_rev_list_raw) - 1

version = f"{llvm_major}.{llvm_minor}.{llvm_patch}{llvm_suffix}-{distance}"
print(f"version {version}")

with open("package-in.json", "rt") as f:
    package_json = json.load(f)
package_json["version"] = version
package_json["scripts"]["build"] += f" --define:VERSION=\\\"{version}\\\""
with open("package.json", "wt") as f:
    json.dump(package_json, f, indent=2)
