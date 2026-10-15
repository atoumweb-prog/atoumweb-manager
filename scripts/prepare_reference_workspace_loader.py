"""Import the CLI recovery module without executing its opt-in entry point."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location('reference_recovery', Path(__file__).with_name('prepare-reference-workspace.py'))
recovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)
