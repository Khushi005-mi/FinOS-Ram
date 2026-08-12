from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.logging import logger


# 1. Base Domain Exception Class
class FinOSError(Exception):
    """Base domain exception for all FinOS backend errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "FINOS_ERROR",
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)


# 2. Derived Specific Domain Exceptions
class TenantNotFoundError(FinOSError):
    def __init__(self, message: str = "Organization tenant not found or access denied."):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="TENANT_NOT_FOUND",
        )


class UnbalancedLedgerError(FinOSError):
    def __init__(self, message: str = "Unbalanced Ledger: Total Debits do not equal Total Credits."):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="UNBALANCED_LEDGER",
        )


class FileParsingError(FinOSError):
    def __init__(self, message: str = "Failed to parse uploaded financial file stream."):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="FILE_PARSING_ERROR",
        )


# 3. Global Exception Handler Registration Function
def register_exception_handlers(app: FastAPI) -> None:
    """
    Attaches global exception handlers to FastAPI instance.
    Intercepts all raised FinOSErrors and converts them to uniform JSON error payloads.
    """

    @app.exception_handler(FinOSError)
    async def finos_error_handler(request: Request, exc: FinOSError):
        logger.error(f"[{exc.error_code}] {exc.message} (Path: {request.url.path})")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "errorCode": exc.error_code,
                "statusCode": exc.status_code,
                "details": None,
            },
        )