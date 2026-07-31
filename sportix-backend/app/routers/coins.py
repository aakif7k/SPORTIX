from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.schemas.coins import CoinAward, CoinSpend
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
async def award_coins(payload: CoinAward, user=Depends(get_current_user)):
    """Admin/system endpoint to award coins to a user."""
    data = await coins_service.award(
        payload.user_id, payload.amount, payload.reason, payload.source
    )
    return {"success": True, "data": data}


@router.post("/spend")
async def spend_coins(payload: CoinSpend, user=Depends(get_current_user)):
    data = await coins_service.spend(
        user["id"], payload.amount, payload.reason, payload.source
    )
    return {"success": True, "data": data}
