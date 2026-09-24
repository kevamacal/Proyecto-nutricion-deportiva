"""FastAPI router handling athletic activity logging, calculations, and persistence."""

from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import (
    ActivityLogRequest,
    ActivityLogResponse,
    LogActivitySessionRequest,
    LoggedActivityEntryResponse,
)
from src.backend.services.activity_service import activity_service

router = APIRouter(prefix="/api/v1/activities", tags=["Activities"])


@router.post(
    "/log", status_code=status.HTTP_201_CREATED, response_model=ActivityLogResponse
)
def log_activity(payload: ActivityLogRequest) -> ActivityLogResponse:
    """Calculate energy expenditure and recovery demands for session."""
    return activity_service.log_activity(payload)


@router.get("", response_model=list[LoggedActivityEntryResponse])
def get_logged_activities(
    user_id: UUID = Query(...),
    date: str = Query(...),
) -> list[LoggedActivityEntryResponse]:
    """Fetch logged athletic activities for user and date."""
    return activity_service.get_logged_activities(user_id, date)


@router.post(
    "/session",
    response_model=LoggedActivityEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def log_activity_session(
    payload: LogActivitySessionRequest,
) -> LoggedActivityEntryResponse:
    """Persist full athletic activity session with specialized sports rows."""
    return activity_service.log_activity_session(payload)


@router.put("/session/{activity_id}", response_model=LoggedActivityEntryResponse)
def update_activity_session(
    activity_id: UUID, payload: LogActivitySessionRequest
) -> LoggedActivityEntryResponse:
    """Update existing athletic activity session."""
    return activity_service.update_activity_session(activity_id, payload)


@router.delete("/session/{activity_id}")
def delete_activity_session(activity_id: UUID) -> dict[str, str]:
    """Delete activity session."""
    activity_service.delete_activity_session(activity_id)
    return {"status": "success", "message": "Activity session deleted"}
