import sys
import os
import importlib.util

REQUIRED_PACKAGES = ["requests", "openpyxl", "dotenv"]


def check_python_version():
    print(f"Python version: {sys.version}")
    if sys.version_info < (3, 8):
        print("[WARN] Python 3.8+ recommended")
    else:
        print("[OK] Python version OK")


def check_env_file():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        print("[OK] .env file found")
        from dotenv import load_dotenv
        load_dotenv(env_path)
        for key in ["CEREBRAS_API_KEY", "GROQ_API_KEY"]:
            if os.getenv(key):
                val = os.getenv(key)
                print(f"[OK] {key} is set (len={len(val)})")
            else:
                print(f"[WARN] {key} is NOT set in .env")
    else:
        print(f"[WARN] .env file not found at {env_path}")


def check_packages():
    for pkg in REQUIRED_PACKAGES:
        spec = importlib.util.find_spec(pkg.replace("-", "_"))
        if spec is None:
            print(f"[FAIL] {pkg} is NOT installed")
        else:
            print(f"[OK] {pkg} is installed")


def main():
    print("=" * 50)
    print("  EVALUATOR SETUP VALIDATOR")
    print("=" * 50)
    check_python_version()
    check_packages()
    check_env_file()
    print("=" * 50)


if __name__ == "__main__":
    main()
