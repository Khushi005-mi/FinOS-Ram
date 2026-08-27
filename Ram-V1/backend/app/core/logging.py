# 1. Get or create logger instance
import logging
import sys
from app.core.config import settings
# 2. Set Log Level dynamically based on settings.DEBUG
logger = logging.getLogger("finos")
logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

# If DEBUG is True -> logging.DEBUG (verbose logs)
# If DEBUG is False -> logging.INFO (production logs)
if not logger.handlers:
# 3. Avoid adding duplicate handlers if logger already has handlers
   console_handler = logging.StreamHandler(sys.stdout)
    # Create console handler pointing to sys.stdout
    # Define clean log format: "2026-08-08 06:00:00 | INFO     | finos | Server initialized"
   formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
   console_handler.setFormatter(formatter)
   logger.addHandler(console_handler)
