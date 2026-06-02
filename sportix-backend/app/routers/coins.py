from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.coins import CoinTransaction
from app.schemas.coins import CoinBalanceResponse, CoinTransactionResponse, PurchaseRequest
from app.services.coins_service import get_or_create_user_coins, spend_coins

router = APIRouter(prefix="/api/coins", tags=["coins"])

@router.get("/balance", response_model=CoinBalanceResponse)
async def get_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_or_create_user_coins(db, current_user.id)

@router.get("/transactions", response_model=List[CoinTransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CoinTransaction)
        .where(CoinTransaction.user_id == current_user.id)
        .order_by(CoinTransaction.created_at.desc())
    )
    return list(result.scalars().all())

@router.post("/purchase")
async def purchase_cosmetic(
    purchase: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Perform transaction
    description = f"Purchased {purchase.item_type.title()}: {purchase.item_id}"
    await spend_coins(
        db,
        current_user.id,
        purchase.cost,
        f"purchase_{purchase.item_type}",
        description
    )
    
    # Apply to user profile
    if purchase.item_type == "theme":
        current_user.profile_theme = purchase.item_id
    elif purchase.item_type == "banner":
        current_user.profile_banner = purchase.item_id
    elif purchase.item_type == "border":
        current_user.profile_border = purchase.item_id
    elif purchase.item_type == "effect":
        current_user.profile_effect = purchase.item_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cosmetic item type"
        )
        
    await db.flush()
    return {
        "success": True,
        "message": f"Successfully purchased and equipped {purchase.item_id}",
        "profile_theme": current_user.profile_theme,
        "profile_banner": current_user.profile_banner,
        "profile_border": current_user.profile_border,
        "profile_effect": current_user.profile_effect
    }
