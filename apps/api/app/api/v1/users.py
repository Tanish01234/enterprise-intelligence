from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_users():
    """List users (placeholder)."""
    return {"users": []}


@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get user by ID (placeholder)."""
    return {"user_id": user_id}
