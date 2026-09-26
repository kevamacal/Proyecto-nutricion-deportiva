"""FastAPI router for Authentication and Session Management."""

from fastapi import APIRouter

from src.backend.api.v1.schemas import AuthResponse, LoginRequest, RegisterRequest
from src.backend.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/login")
def login(payload: LoginRequest) -> AuthResponse:
    """Authenticate user with email and password."""
    return auth_service.login(payload)


@router.post("/register")
def register(payload: RegisterRequest) -> AuthResponse:
    """Register a new user account."""
    return auth_service.register(payload)
