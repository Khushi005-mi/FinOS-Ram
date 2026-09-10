import json
import logging
import sys
import time
from typing import Any, Dict
from contextvars import ContextVar

# Context variables for distributed tracing
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="none")
tenant_id_ctx: ContextVar[str] = ContextVar("tenant_id", default="none")

class StructuredJsonFormatter(logging.Formatter):
    """
    Production-grade JSON log formatter for ELK, Datadog, and CloudWatch ingestion.
    Automatically injects request_id, tenant_id, and standardized ISO timestamps.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
            "tenant_id": tenant_id_ctx.get(),
            "environment": "development",
            "source": f"{record.filename}:{record.lineno}",
        }
        
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredJsonFormatter())
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers on reload
    if not root_logger.handlers:
        root_logger.addHandler(handler)
    else:
        root_logger.handlers = [handler]

    # Silence verbose third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
