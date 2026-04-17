from pydantic import BaseModel

from app.schemas.common import HttpMethod, AuthType, BodyType


class KeyValuePair(BaseModel):
    key: str
    value: str
    enabled: bool = True


class AuthConfig(BaseModel):
    type: AuthType = AuthType.NONE
    bearer_token: str | None = None
    basic_username: str | None = None
    basic_password: str | None = None
    api_key_key: str | None = None
    api_key_value: str | None = None
    api_key_in: str | None = "header"  # "header" or "query"


class SendRequestPayload(BaseModel):
    method: HttpMethod = HttpMethod.GET
    url: str
    headers: list[KeyValuePair] = []
    query_params: list[KeyValuePair] = []
    body_type: BodyType = BodyType.NONE
    body_content: str | None = None
    raw_sub_type: str | None = None
    auth: AuthConfig = AuthConfig()


class SendRequestResponse(BaseModel):
    status_code: int | None = None
    status_text: str | None = None
    response_headers: dict[str, str] = {}
    body: str | None = None
    is_json: bool = False
    time_ms: float | None = None
    size_bytes: int | None = None
    error: str | None = None
