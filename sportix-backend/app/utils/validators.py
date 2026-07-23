import re


def is_valid_username(username: str) -> bool:
    return bool(re.match(r'^[a-z0-9_]{3,30}$', username))


def is_valid_sport(sport: str) -> bool:
    VALID_SPORTS = {
        "football", "basketball", "cricket", "tennis", "badminton",
        "volleyball", "rugby", "hockey", "swimming", "athletics",
        "boxing", "mma", "cycling", "golf", "baseball", "esports",
    }
    return sport.lower() in VALID_SPORTS


def sanitize_content(text: str, max_length: int = 5000) -> str:
    """Basic content sanitization — strip extra whitespace, enforce max length."""
    return text.strip()[:max_length]
