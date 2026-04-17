from enum import Enum


class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"


class AuthType(str, Enum):
    NONE = "none"
    BEARER = "bearer"
    BASIC = "basic"
    API_KEY = "api_key"


class BodyType(str, Enum):
    NONE = "none"
    JSON = "json"
    FORM = "form"
    FORM_URLENCODED = "form_urlencoded"
    MULTIPART = "multipart"
    XML = "xml"
    GRAPHQL = "graphql"
    RAW = "raw"
    BINARY = "binary"
