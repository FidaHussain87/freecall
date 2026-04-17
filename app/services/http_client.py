import json
import time

import httpx

from app.config import settings
from app.schemas.common import AuthType, BodyType
from app.schemas.request import SendRequestPayload, SendRequestResponse, KeyValuePair, AuthConfig
from app.services.variable_resolver import resolve_variables

MAX_RESPONSE_SIZE = 10 * 1024 * 1024  # 10 MB


def _build_dict(pairs: list[KeyValuePair], variables: dict[str, str]) -> dict[str, str]:
    """Convert enabled KeyValuePairs to a dict, resolving variables."""
    result = {}
    for pair in pairs:
        if pair.enabled:
            key = resolve_variables(pair.key, variables)
            value = resolve_variables(pair.value, variables)
            result[key] = value
    return result


async def execute_request(
    payload: SendRequestPayload,
    variables: dict[str, str] | None = None,
) -> SendRequestResponse:
    variables = variables or {}

    url = resolve_variables(payload.url, variables)

    # Basic URL validation
    if not url or (not url.startswith("http://") and not url.startswith("https://")):
        if url and not url.startswith("http"):
            url = "https://" + url
        elif not url:
            return SendRequestResponse(error="URL is required")

    headers = _build_dict(payload.headers, variables)
    params = _build_dict(payload.query_params, variables)

    # Auth
    auth = None
    if payload.auth.type == AuthType.BEARER and payload.auth.bearer_token:
        token = resolve_variables(payload.auth.bearer_token, variables)
        headers["Authorization"] = f"Bearer {token}"
    elif payload.auth.type == AuthType.BASIC:
        username = resolve_variables(payload.auth.basic_username or "", variables)
        password = resolve_variables(payload.auth.basic_password or "", variables)
        auth = httpx.BasicAuth(username, password)
    elif payload.auth.type == AuthType.API_KEY and payload.auth.api_key_key:
        key = resolve_variables(payload.auth.api_key_key, variables)
        value = resolve_variables(payload.auth.api_key_value or "", variables)
        if payload.auth.api_key_in == "query":
            params[key] = value
        else:
            headers[key] = value

    # Body
    json_body = None
    data_body = None
    content_body = None

    if payload.body_type == BodyType.JSON and payload.body_content:
        raw = resolve_variables(payload.body_content, variables)
        try:
            json_body = json.loads(raw)
        except json.JSONDecodeError as e:
            return SendRequestResponse(error=f"Invalid JSON body: {e}")
    elif payload.body_type in (BodyType.FORM, BodyType.FORM_URLENCODED) and payload.body_content:
        raw = resolve_variables(payload.body_content, variables)
        try:
            parsed = json.loads(raw)
            # Support both dict and list-of-KV-pairs format
            if isinstance(parsed, list):
                data_body = {
                    item["key"]: item["value"]
                    for item in parsed
                    if isinstance(item, dict) and item.get("enabled", True) and item.get("key")
                }
            elif isinstance(parsed, dict):
                data_body = parsed
            else:
                return SendRequestResponse(error="Form data must be a JSON object or array of key-value pairs")
        except json.JSONDecodeError as e:
            return SendRequestResponse(error=f"Invalid form data JSON: {e}")
    elif payload.body_type == BodyType.XML and payload.body_content:
        content_body = resolve_variables(payload.body_content, variables)
        if "content-type" not in {k.lower() for k in headers}:
            headers["Content-Type"] = "application/xml"
    elif payload.body_type == BodyType.GRAPHQL and payload.body_content:
        raw = resolve_variables(payload.body_content, variables)
        try:
            json_body = json.loads(raw)
        except json.JSONDecodeError as e:
            return SendRequestResponse(error=f"Invalid GraphQL JSON: {e}")
        if "content-type" not in {k.lower() for k in headers}:
            headers["Content-Type"] = "application/json"
    elif payload.body_type == BodyType.RAW and payload.body_content:
        content_body = resolve_variables(payload.body_content, variables)
        # Set content-type based on raw sub-type if not already set
        if "content-type" not in {k.lower() for k in headers}:
            sub_type_map = {
                "html": "text/html",
                "xml": "application/xml",
                "javascript": "application/javascript",
            }
            ct = sub_type_map.get(payload.raw_sub_type or "", "text/plain")
            headers["Content-Type"] = ct

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            verify=False,
            timeout=settings.request_timeout,
        ) as client:
            start = time.perf_counter()
            response = await client.request(
                method=payload.method.value,
                url=url,
                headers=headers,
                params=params,
                auth=auth,
                json=json_body,
                data=data_body,
                content=content_body,
            )
            elapsed_ms = (time.perf_counter() - start) * 1000

        body_bytes = response.content
        size = len(body_bytes)

        # Truncate very large responses to prevent memory issues
        if size > MAX_RESPONSE_SIZE:
            body_text = body_bytes[:MAX_RESPONSE_SIZE].decode("utf-8", errors="replace")
            body_text += f"\n\n[Response truncated: {size:,} bytes total, showing first {MAX_RESPONSE_SIZE:,}]"
        else:
            body_text = body_bytes.decode("utf-8", errors="replace")

        content_type = response.headers.get("content-type", "")
        is_json = "json" in content_type

        resp_headers = dict(response.headers)

        return SendRequestResponse(
            status_code=response.status_code,
            status_text=response.reason_phrase,
            response_headers=resp_headers,
            body=body_text,
            is_json=is_json,
            time_ms=round(elapsed_ms, 2),
            size_bytes=size,
        )

    except httpx.TimeoutException:
        return SendRequestResponse(error=f"Request timed out after {settings.request_timeout}s")
    except httpx.ConnectError:
        return SendRequestResponse(error=f"Connection failed: Could not connect to {url}")
    except httpx.TooManyRedirects:
        return SendRequestResponse(error="Too many redirects")
    except httpx.InvalidURL as e:
        return SendRequestResponse(error=f"Invalid URL: {e}")
    except Exception as e:
        return SendRequestResponse(error=f"Request failed: {type(e).__name__}: {e}")


async def execute_multipart_request(
    method: str,
    url: str,
    headers_kv: list[KeyValuePair],
    params_kv: list[KeyValuePair],
    auth: AuthConfig,
    text_fields: dict[str, str],
    file_fields: dict[str, tuple[str, bytes, str]],
    is_binary: bool = False,
    variables: dict[str, str] | None = None,
) -> SendRequestResponse:
    """Execute a multipart/form-data or binary upload request."""
    variables = variables or {}

    url = resolve_variables(url, variables)
    if not url or (not url.startswith("http://") and not url.startswith("https://")):
        if url and not url.startswith("http"):
            url = "https://" + url
        elif not url:
            return SendRequestResponse(error="URL is required")

    headers = _build_dict(headers_kv, variables)
    params = _build_dict(params_kv, variables)

    # Auth
    httpx_auth = None
    if auth.type == AuthType.BEARER and auth.bearer_token:
        token = resolve_variables(auth.bearer_token, variables)
        headers["Authorization"] = f"Bearer {token}"
    elif auth.type == AuthType.BASIC:
        username = resolve_variables(auth.basic_username or "", variables)
        password = resolve_variables(auth.basic_password or "", variables)
        httpx_auth = httpx.BasicAuth(username, password)
    elif auth.type == AuthType.API_KEY and auth.api_key_key:
        key = resolve_variables(auth.api_key_key, variables)
        value = resolve_variables(auth.api_key_value or "", variables)
        if auth.api_key_in == "query":
            params[key] = value
        else:
            headers[key] = value

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            verify=False,
            timeout=settings.request_timeout,
        ) as client:
            start = time.perf_counter()

            if is_binary and file_fields:
                # Send as binary content
                _, (filename, content, content_type) = next(iter(file_fields.items()))
                if "content-type" not in {k.lower() for k in headers}:
                    headers["Content-Type"] = content_type
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    auth=httpx_auth,
                    content=content,
                )
            else:
                # Build multipart files list
                files = {}
                for field_name, (filename, content, content_type) in file_fields.items():
                    files[field_name] = (filename, content, content_type)

                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    auth=httpx_auth,
                    data=text_fields,
                    files=files if files else None,
                )

            elapsed_ms = (time.perf_counter() - start) * 1000

        body_bytes = response.content
        size = len(body_bytes)

        if size > MAX_RESPONSE_SIZE:
            body_text = body_bytes[:MAX_RESPONSE_SIZE].decode("utf-8", errors="replace")
            body_text += f"\n\n[Response truncated: {size:,} bytes total, showing first {MAX_RESPONSE_SIZE:,}]"
        else:
            body_text = body_bytes.decode("utf-8", errors="replace")

        content_type = response.headers.get("content-type", "")
        is_json = "json" in content_type

        return SendRequestResponse(
            status_code=response.status_code,
            status_text=response.reason_phrase,
            response_headers=dict(response.headers),
            body=body_text,
            is_json=is_json,
            time_ms=round(elapsed_ms, 2),
            size_bytes=size,
        )

    except httpx.TimeoutException:
        return SendRequestResponse(error=f"Request timed out after {settings.request_timeout}s")
    except httpx.ConnectError:
        return SendRequestResponse(error=f"Connection failed: Could not connect to {url}")
    except httpx.TooManyRedirects:
        return SendRequestResponse(error="Too many redirects")
    except httpx.InvalidURL as e:
        return SendRequestResponse(error=f"Invalid URL: {e}")
    except Exception as e:
        return SendRequestResponse(error=f"Request failed: {type(e).__name__}: {e}")
