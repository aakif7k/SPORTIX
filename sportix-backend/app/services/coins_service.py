from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings


async def get_balance(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_user_coins,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    if res.get("documents"):
        return res["documents"][0]
    # Create wallet if missing
    return db.create_document(DB_ID, settings.collection_user_coins, ID.unique(),
                               {"userId": user_id, "balance": 0.0})


async def get_transactions(user_id: str, page: int, limit: int) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_coin_transactions,
        queries=[Q.equal("userId", user_id), Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt")],
    )


async def award(user_id: str, amount: float, reason: str) -> dict:
    """Add coins to user wallet and log transaction."""
    wallet = await get_balance(user_id)
    new_balance = wallet.get("balance", 0) + amount
    db.update_document(DB_ID, settings.collection_user_coins, wallet["$id"], {"balance": new_balance})
    tx = db.create_document(DB_ID, settings.collection_coin_transactions, ID.unique(), {
        "userId": user_id, "type": "credit", "amount": amount,
        "reason": reason, "balanceAfter": new_balance,
    })
    return {"balance": new_balance, "transaction": tx}


async def spend(user_id: str, amount: float, reason: str) -> dict:
    """Deduct coins from user wallet."""
    wallet = await get_balance(user_id)
    current = wallet.get("balance", 0)
    if current < amount:
        raise ValueError(f"Insufficient coins: have {current}, need {amount}")
    new_balance = current - amount
    db.update_document(DB_ID, settings.collection_user_coins, wallet["$id"], {"balance": new_balance})
    tx = db.create_document(DB_ID, settings.collection_coin_transactions, ID.unique(), {
        "userId": user_id, "type": "debit", "amount": amount,
        "reason": reason, "balanceAfter": new_balance,
    })
    return {"balance": new_balance, "transaction": tx}
