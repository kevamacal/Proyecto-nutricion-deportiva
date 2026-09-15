"""FastAPI router handling athletic activity logging and expenditure calculation."""

from fastapi import APIRouter, status

from src.backend.api.v1.schemas import ActivityLogRequest, ActivityLogResponse
from src.backend.services.activity_service import activity_service

router = APIRouter(prefix="/api/v1/activities", tags=["Activities"])


@router.post("/log", status_code=status.HTTP_201_CREATED)
def log_activity(payload: ActivityLogRequest) -> ActivityLogResponse:
    """Log an athletic activity session (Basketball or Strength Training) and return expenditure."""
    return activity_service.log_activity(payload)
