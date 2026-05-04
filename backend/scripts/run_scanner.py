import sys
import os

# Add the scripts directory to path to allow vision module imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from vision.scanner import ProductScanner
    print("[JAGOAI VISION] Starting optimized scanner...")
    scanner = ProductScanner(camera_index=0)
    scanner.run()
except KeyboardInterrupt:
    print("\n[JAGOAI VISION] Stopping scanner...")
except Exception as e:
    print(f"[JAGOAI VISION] Error: {e}")
