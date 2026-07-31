"""Coin request bodies.

These were bare scalars on the handlers, so FastAPI bound them from the query
string: POST /api/coins/award?user_id=x&amount=999&reason=... . Beyond putting
economy mutations in access logs and browser history, a query-string grant is
trivially forgeable from a link.
"""
from pydantic import BaseModel, field_validator


class CoinAward(BaseModel):
    user_id: str
    amount: int
    reason: str
    source: str = "reward"

    @field_validator("amount")
    @classmethod
    def positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


class CoinSpend(BaseModel):
    amount: int
    reason: str
    source: str = "purchase"

    @field_validator("amount")
    @classmethod
    def positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v
