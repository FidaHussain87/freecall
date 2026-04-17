import re


def resolve_variables(text: str, variables: dict[str, str]) -> str:
    """Replace {{variable}} placeholders with values from the variables dict."""
    if not text or not variables:
        return text or ""

    def replacer(match: re.Match) -> str:
        key = match.group(1).strip()
        return variables.get(key, match.group(0))

    return re.sub(r"\{\{(.+?)\}\}", replacer, text)
