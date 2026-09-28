from datetime import datetime
from typing import Optional


def format_timestamp(timestamp: Optional[int]) -> Optional[str]:
    """Converte um timestamp UNIX (em segundos) para o formato YYYY-MM-DD HH:MM:SS."""
    if not timestamp:
        return None
    try:
        return datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
    except (ValueError, TypeError, OverflowError):
        return None