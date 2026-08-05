"""Tournament request bodies."""
from pydantic import BaseModel, field_validator


class TournamentEntry(BaseModel):
    """Which squad is entering or withdrawing."""
    squad_id: str

    @field_validator("squad_id")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A squad id is required")
        return v.strip()
