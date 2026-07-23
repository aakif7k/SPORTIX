from datetime import datetime


def format_datetime(dt_str: str) -> str:
    """Format ISO datetime string to human-readable."""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y at %I:%M %p")
    except Exception:
        return dt_str


def format_number(n: int | float) -> str:
    """Format large numbers: 1200 → '1.2K', 1200000 → '1.2M'."""
    if n >= 1_000_000:
        return f"{n/1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n/1_000:.1f}K"
    return str(int(n))


def strip_appwrite_meta(doc: dict) -> dict:
    """Remove Appwrite internal fields from a document dict."""
    internal = {"$id", "$collectionId", "$databaseId", "$createdAt", "$updatedAt", "$permissions"}
    return {k: v for k, v in doc.items() if k not in internal}
