from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso


async def get_balance(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_user_coins,
        queries=[Q.equal("user_id", user_id), Q.limit(1)],
    )
    if res.get("documents"):
        return res["documents"][0]
    # Create the wallet on first read. balance is an integer column: coins are
    # whole units, and 0.0 would have been rejected.
    now = now_iso()
    return db.create_document(
        DB_ID, settings.collection_user_coins, ID.unique(),
        {
            "user_id": user_id,
            "balance": 0,
            "total_earned": 0,
            "total_spent": 0,
            "created_at": now,
            "updated_at": now,
        },
    )


async def get_transactions(user_id: str, page: int, limit: int) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_coin_transactions,
        queries=[Q.equal("user_id", user_id), Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt")],
    )


async def award(user_id: str, amount: float, reason: str, source: str = "reward") -> dict:
    """
    Credit coins and log the transaction.

    balance, total_earned and total_spent are all int columns, so the amount is
    coerced to a whole number of coins here. It used to be written through as
    given: a float amount -- which the signature invites, and which the streak
    reward passed -- made Appwrite reject the update with a 400, and the caller saw
    a swallowed failure and a balance that never moved.

    total_earned was also never maintained, so it stayed at zero for every account
    no matter how much was awarded.
    """
    coins = int(round(amount))
    if coins <= 0:
        raise ValueError("A coin award must be a positive whole number")

    wallet = await get_balance(user_id)
    new_balance = int(wallet.get("balance", 0) or 0) + coins
    now = now_iso()

    db.update_document(DB_ID, settings.collection_user_coins, wallet["$id"], {
        "balance": new_balance,
        "total_earned": int(wallet.get("total_earned", 0) or 0) + coins,
        "updated_at": now,
    })
    tx = db.create_document(DB_ID, settings.collection_coin_transactions, ID.unique(), {
        "user_id": user_id, "direction": "credit", "source": source, "amount": coins,
        "reason": reason, "balance_after": new_balance, "created_at": now,
    })
    return {"balance": new_balance, "transaction": tx}


async def spend(user_id: str, amount: float, reason: str, source: str = "purchase") -> dict:
    """Deduct coins from user wallet."""
    coins = int(round(amount))
    if coins <= 0:
        raise ValueError("A coin spend must be a positive whole number")

    wallet = await get_balance(user_id)
    current = int(wallet.get("balance", 0) or 0)
    if current < coins:
        raise ValueError(f"Insufficient coins: have {current}, need {coins}")
    new_balance = current - coins
    now = now_iso()
    db.update_document(DB_ID, settings.collection_user_coins, wallet["$id"], {
        "balance": new_balance,
        # Never maintained before, so it read zero however much had been spent.
        "total_spent": int(wallet.get("total_spent", 0) or 0) + coins,
        "updated_at": now,
    })
    tx = db.create_document(DB_ID, settings.collection_coin_transactions, ID.unique(), {
        "user_id": user_id, "direction": "debit", "source": source, "amount": coins,
        "reason": reason, "balance_after": new_balance, "created_at": now,
    })
    return {"balance": new_balance, "transaction": tx}
