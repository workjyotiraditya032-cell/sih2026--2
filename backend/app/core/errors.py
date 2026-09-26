import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

FIELD_LABELS = {
    "commodity": "Commodity",
    "food_category": "Food category",
    "moisture_content": "Moisture content",
    "oil_content": "Oil/fat content",
    "ph": "pH",
    "respiration_rate": "Respiration rate",
    "moisture_sensitivity": "Moisture sensitivity",
    "oxygen_sensitivity": "Oxygen sensitivity",
    "shelf_life_days": "Desired shelf life",
    "storage_type": "Storage type",
    "temperature": "Storage temperature",
    "relative_humidity": "Relative humidity",
    "transportation": "Transportation condition",
    "cost_priority": "Cost priority",
    "sustainability_priority": "Sustainability priority",
    "map_required": "MAP requirement",
    "weight_overrides": "Weight overrides",
    "location": "Location",
}


class NoCompatibleMaterialError(Exception):
    def __init__(self, excluded: list[dict]):
        super().__init__("No compatible packaging material found")
        self.excluded = excluded


class ExternalServiceError(Exception):
    pass


class LocationNotFoundError(Exception):
    pass


class HistoryUnavailableError(Exception):
    pass


def _format_validation_errors(exc: RequestValidationError) -> list[dict]:
    errors = []
    for err in exc.errors():
        loc = [str(part) for part in err.get("loc", []) if part not in ("body", "query", "path")]
        field = loc[0] if loc else None
        message = str(err.get("msg", "Invalid value")).removeprefix("Value error, ")
        if err.get("type") == "missing":
            message = "This field is required"
        label = FIELD_LABELS.get(field, field) if field else None
        errors.append({"field": field, "message": f"{label}: {message}" if label else message})
    return errors


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Some inputs are invalid. Please review the highlighted fields.",
                "code": "validation_error",
                "errors": _format_validation_errors(exc),
            },
        )

    @app.exception_handler(NoCompatibleMaterialError)
    async def no_match_handler(_: Request, exc: NoCompatibleMaterialError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": "No packaging material in the knowledge base satisfies these requirements. "
                "Try relaxing storage, shelf-life or sensitivity constraints.",
                "code": "no_compatible_material",
                "excluded_materials": exc.excluded,
            },
        )

    @app.exception_handler(LocationNotFoundError)
    async def location_handler(_: Request, exc: LocationNotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc), "code": "location_not_found"})

    @app.exception_handler(ExternalServiceError)
    async def external_handler(_: Request, exc: ExternalServiceError):
        return JSONResponse(status_code=503, content={"detail": str(exc), "code": "external_service_unavailable"})

    @app.exception_handler(HistoryUnavailableError)
    async def history_handler(_: Request, exc: HistoryUnavailableError):
        return JSONResponse(status_code=503, content={"detail": str(exc), "code": "history_unavailable"})

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_: Request, exc: StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception):
        logger.exception("Unhandled server error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred. Please try again.", "code": "server_error"},
        )
