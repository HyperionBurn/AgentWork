#!/usr/bin/env python3
"""
AgentWork — Windows Pre-Check for Moccasin/Vyper (M4)
Validates that the toolchain is available before attempting deployment.
"""

import platform
import shutil
import subprocess
import sys


def check_command(cmd: str, name: str) -> bool:
    """Check if a command is available on PATH."""
    if shutil.which(cmd):
        print(f"  ✅ {name} found: {shutil.which(cmd)}")
        return True
    print(f"  ❌ {name} not found on PATH")
    return False


def main() -> None:
    print("=" * 60)
    print("  AgentWork — Moccasin/Vyper Pre-Check (M4)")
    print("=" * 60)
    print(f"\n  Platform: {platform.system()} {platform.release()}")
    print(f"  Python:   {sys.version.split()[0]}\n")

    checks = [
        ("moccasin", "Moccasin Framework"),
        ("vyper", "Vyper Compiler"),
    ]

    all_ok = True
    for cmd, name in checks:
        if not check_command(cmd, name):
            all_ok = False

    # Try moccasin version
    if shutil.which("moccasin"):
        try:
            result = subprocess.run(
                ["moccasin", "--version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            print(f"\n  Moccasin version: {result.stdout.strip() or result.stderr.strip()}")
        except Exception as e:
            print(f"\n  ⚠️  Moccasin version check failed: {e}")

    # Try vyper version
    if shutil.which("vyper"):
        try:
            result = subprocess.run(
                ["vyper", "--version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            print(f"  Vyper version:    {result.stdout.strip()}")
        except Exception as e:
            print(f"  ⚠️  Vyper version check failed: {e}")

    print("\n" + "=" * 60)

    if all_ok:
        print("  ✅ ALL CHECKS PASSED — ready to deploy!")
        print("\n  Run:")
        print("    cd packages/contracts")
        print("    moccasin run script/deploy.py --network arc_testnet")
    else:
        print("  ❌ SOME CHECKS FAILED")
        if platform.system() == "Windows":
            print("\n  Windows fallback options:")
            print("    1. Try WSL:  wsl moccasin run script/deploy.py --network arc_testnet")
            print("    2. Try Docker:  docker compose run deploy-contracts")
            print("    3. Install via pip:  pip install moccasin vyper")
        else:
            print("\n  Install missing tools:  pip install moccasin vyper")

    print("=" * 60)
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
