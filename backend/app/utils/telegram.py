import hashlib
import hmac
import json
import time
from urllib.parse import parse_qs, unquote

from app.config import settings
from app.schemas.user import TelegramUserData


class TelegramAuthError(Exception):
    pass


def validate_init_data(init_data: str) -> TelegramUserData:
    parsed = parse_qs(init_data)

    if "hash" not in parsed:
        raise TelegramAuthError("Missing hash in initData")

    received_hash = parsed.pop("hash")[0]

    if "auth_date" not in parsed:
        raise TelegramAuthError("Missing auth_date in initData")

    auth_date = int(parsed["auth_date"][0])
    current_time = int(time.time())

    if current_time - auth_date > settings.init_data_max_age_seconds:
        raise TelegramAuthError("initData is expired")

    data_check_pairs = []
    for key in sorted(parsed.keys()):
        values = parsed[key]
        for value in values:
            data_check_pairs.append(f"{key}={value}")

    data_check_string = "\n".join(data_check_pairs)

    secret_key = hmac.new(
        b"WebAppData",
        settings.telegram_bot_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise TelegramAuthError("Invalid initData hash")

    if "user" not in parsed:
        raise TelegramAuthError("Missing user in initData")

    user_json = unquote(parsed["user"][0])
    user_data = json.loads(user_json)

    return TelegramUserData(
        id=user_data["id"],
        first_name=user_data.get("first_name", ""),
        last_name=user_data.get("last_name"),
        username=user_data.get("username"),
        language_code=user_data.get("language_code"),
        photo_url=user_data.get("photo_url"),
    )
