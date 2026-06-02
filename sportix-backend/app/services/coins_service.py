import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.coins import UserCoins, CoinTransaction
from app.websockets.manager import ws_manager

async def get_or_create_user_coins(db: AsyncSession, user_id: uuid.UUID) -> UserCoins:
    result = await db.execute(select(UserCoins).where(UserCoins.user_id == user_id))
    user_coins = result.scalar_one_or_none()
    if not user_coins:
        user_coins = UserCoins(
            id=uuid.uuid4(),
            user_id=user_id,
            balance=0,
            total_earned=0,
            total_spent=0
        )
        db.add(user_coins)
        await db.flush()
    return user_coins

async def add_coins(
    db: AsyncSession,
    user_id: uuid.UUID,
    amount: int,
    transaction_type: str,
    description: str,
    reference_id: str = None
) -> int:
    user_coins = await get_or_create_user_coins(db, user_id)
    
    user_coins.balance += amount
    user_coins.total_earned += amount
    
    transaction = CoinTransaction(
        id=uuid.uuid4(),
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        description=description,
        reference_id=reference_id,
        balance_after=user_coins.balance
    )
    db.add(transaction)
    await db.flush()
    
    # Broadcast to live WebSockets if user is connected
    await ws_manager.send_notification_to_user(
        user_id,
        {
            "event": "coins_earned",
            "data": {
                "amount": amount,
                "balance": user_coins.balance,
                "type": transaction_type,
                "description": description
            }
        }
    )
    return user_coins.balance

async def spend_coins(
    db: AsyncSession,
    user_id: uuid.UUID,
    amount: int,
    transaction_type: str,
    description: str
) -> int:
    user_coins = await get_or_create_user_coins(db, user_id)
    
    if user_coins.balance < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient SPORTiX Coins"
        )
        
    user_coins.balance -= amount
    user_coins.total_spent += amount
    
    transaction = CoinTransaction(
        id=uuid.uuid4(),
        user_id=user_id,
        amount=-amount,
        transaction_type=transaction_type,
        description=description,
        balance_after=user_coins.balance
    )
    db.add(transaction)
    await db.flush()
    
    # Broadcast to live WebSockets if user is connected
    await ws_manager.send_notification_to_user(
        user_id,
        {
            "event": "coins_spent",
            "data": {
                "amount": amount,
                "balance": user_coins.balance,
                "type": transaction_type,
                "description": description
            }
        }
    )
    return user_coins.balance
