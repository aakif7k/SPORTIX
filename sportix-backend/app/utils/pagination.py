from typing import Any


def paginate(page: int, limit: int) -> tuple[int, int]:
    """Returns (offset, limit) for Appwrite queries."""
    return page * limit, limit


def paginated_response(docs: list, total: int, page: int, limit: int) -> dict:
    """Wraps a list result into a standard paginated envelope."""
    return {
        "items": docs,
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < total,
    }
