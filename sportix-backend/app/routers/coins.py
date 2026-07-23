from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.services import coins_service

router = APIRouter()


@router.get("/balance")
async def get_balance(user=Depends(get_current_user)):
    data = await coins_service.get_balance(user["id"])
    return {"success": True, "data": data}


@router.get("/transactions")
async def get_transactions(
    page: int = Query(0),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    data = await coins_service.get_transactions(user["id"], page, limit)
    return {"success": True, "data": data}


@router.post("/award")
async def award_coins(user_id: str, amount: float, reason: str, user=Depends(get_current_user)):
    """Admin/system endpoint to award coins to a user."""
    data = await coins_service.award(user_id, amount, reason)
    return {"success": True, "data": data}


@router.post("/spend")
async def spend_coins(amount: float, reason: str, user=Depends(get_current_user)):
    data = await coins_service.spend(user["id"], amount, reason)
    return {"success": True, "data": data}
