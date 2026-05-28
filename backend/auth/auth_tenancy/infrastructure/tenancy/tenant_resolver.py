class TenantResolver:
    HEADER_NAME = "HTTP_X_COMPANY_ID"
    QUERY_PARAM = "company_id"

    @classmethod
    def resolve_company_id(cls, request) -> int | None:
        header_value = request.META.get(cls.HEADER_NAME)
        query_value = request.query_params.get(cls.QUERY_PARAM)
        raw_value = header_value or query_value

        if raw_value in (None, ""):
            return None

        return int(raw_value)
