from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class CoinBalanceResponse(BaseModel):
    balance: int
    total_earned: int
    total_spent: int

    class Config:
        from_attributes = True

class CoinTransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: int
    transaction_type: str
    description: str
    reference_id: Optional[str] = None
    balance_after: int
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseRequest(BaseModel):
    item_id: str
    item_type: str  # theme | banner | border | effect
    cost: int
