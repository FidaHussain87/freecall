import json

from fastapi import APIRouter, Depends, File, Form, UploadFile, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.environment import Environment
from app.models.history import RequestHistory
from app.schemas.common import HttpMethod, BodyType
from app.schemas.request import SendRequestPayload, SendRequestResponse, AuthConfig, KeyValuePair
from app.services.http_client import execute_request, execute_multipart_request

router = APIRouter(prefix="/api", tags=["proxy"])


async def _get_active_variables(db: AsyncSession) -> dict[str, str]:
    result = await db.execute(
        select(Environment).where(Environment.is_active == True)  # noqa: E712
    )
    env = result.scalar_one_or_none()
    if not env:
        return {}
    return {v.key: v.value for v in env.variables}


@router.post("/send", response_model=SendRequestResponse)
async def send_request(payload: SendRequestPayload, db: AsyncSession = Depends(get_db)):
    variables = await _get_active_variables(db)
    response = await execute_request(payload, variables)

    # Save to history
    headers_list = [
        {"key": h.key, "value": h.value, "enabled": h.enabled}
        for h in payload.headers
    ]
    history = RequestHistory(
        method=payload.method.value,
        url=payload.url,
        request_headers=headers_list,
        request_body=payload.body_content,
        status_code=response.status_code,
        response_headers=response.response_headers,
        response_body=response.body,
        response_time_ms=response.time_ms,
        response_size_bytes=response.size_bytes,
        error=response.error,
    )
    db.add(history)
    await db.commit()

    return response


@router.post("/send-multipart", response_model=SendRequestResponse)
async def send_multipart_request(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle multipart/form-data requests with file uploads."""
    form = await request.form()
    variables = await _get_active_variables(db)

    method = form.get("method", "POST")
    url = str(form.get("url", ""))
    body_type = str(form.get("body_type", "multipart"))

    # Parse JSON-encoded fields
    headers_json = form.get("headers_json", "[]")
    query_params_json = form.get("query_params_json", "[]")
    auth_json = form.get("auth_json", '{"type":"none"}')

    try:
        headers_list = json.loads(str(headers_json))
        query_params_list = json.loads(str(query_params_json))
        auth_data = json.loads(str(auth_json))
    except json.JSONDecodeError:
        return SendRequestResponse(error="Invalid JSON in form fields")

    headers_kv = [KeyValuePair(**h) for h in headers_list if isinstance(h, dict)]
    params_kv = [KeyValuePair(**p) for p in query_params_list if isinstance(p, dict)]
    auth = AuthConfig(**auth_data)

    # Collect multipart fields and files
    text_fields: dict[str, str] = {}
    file_fields: dict[str, tuple[str, bytes, str]] = {}

    for key in form:
        val = form[key]
        if key.startswith("field_"):
            field_name = key[6:]  # Remove "field_" prefix
            text_fields[field_name] = str(val)
        elif key.startswith("file_"):
            field_name = key[5:]  # Remove "file_" prefix
            if isinstance(val, UploadFile) and val.filename:
                content = await val.read()
                file_fields[field_name] = (val.filename, content, val.content_type or "application/octet-stream")
        elif key == "binary_file":
            if isinstance(val, UploadFile) and val.filename:
                content = await val.read()
                file_fields["file"] = (val.filename, content, val.content_type or "application/octet-stream")

    response = await execute_multipart_request(
        method=method,
        url=url,
        headers_kv=headers_kv,
        params_kv=params_kv,
        auth=auth,
        text_fields=text_fields,
        file_fields=file_fields,
        is_binary=(body_type == "binary"),
        variables=variables,
    )

    # Save to history
    history = RequestHistory(
        method=method,
        url=url,
        request_headers=[{"key": h.key, "value": h.value, "enabled": h.enabled} for h in headers_kv],
        request_body=f"[multipart: {len(text_fields)} fields, {len(file_fields)} files]",
        status_code=response.status_code,
        response_headers=response.response_headers,
        response_body=response.body,
        response_time_ms=response.time_ms,
        response_size_bytes=response.size_bytes,
        error=response.error,
    )
    db.add(history)
    await db.commit()

    return response
