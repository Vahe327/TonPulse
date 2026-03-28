from decimal import Decimal


def format_price(price: Decimal | float, max_decimals: int = 6) -> str:
    price = Decimal(str(price))
    if price == 0:
        return "0.00"
    if price >= 1000:
        return f"{price:,.2f}"
    if price >= 1:
        return f"{price:.4f}"
    if price >= Decimal("0.01"):
        return f"{price:.4f}"
    return f"{price:.{max_decimals}f}".rstrip("0").rstrip(".")


def format_large_number(num: Decimal | float) -> str:
    num = Decimal(str(num))
    abs_num = abs(num)
    if abs_num >= Decimal("1_000_000_000"):
        return f"${num / Decimal('1_000_000_000'):.2f}B"
    if abs_num >= Decimal("1_000_000"):
        return f"${num / Decimal('1_000_000'):.2f}M"
    if abs_num >= Decimal("1_000"):
        return f"${num / Decimal('1_000'):.2f}K"
    return f"${num:.2f}"


def format_percent(value: Decimal | float) -> str:
    value = Decimal(str(value))
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.2f}%"


def shorten_address(address: str, chars: int = 4) -> str:
    if len(address) <= chars * 2 + 3:
        return address
    return f"{address[:chars]}...{address[-chars:]}"


def nano_to_amount(nano: int | str, decimals: int = 9) -> Decimal:
    return Decimal(str(nano)) / Decimal(10**decimals)


def amount_to_nano(amount: Decimal | float | str, decimals: int = 9) -> int:
    return int(Decimal(str(amount)) * Decimal(10**decimals))
