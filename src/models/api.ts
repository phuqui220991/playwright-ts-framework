/**
 * Error envelope returned by the OrangeHRM REST API v2, as observed:
 *   422 → { error: { status: "422", message: "Invalid Parameter", data: { invalidParamKeys: [...] } } }
 *   404 → { error: { status: "404", message: "Records Not Found" } }
 *   401 → { error: { status: 401, message: "Session expired" } }
 * `status` is a string for most errors but a number for 401, and `data` only accompanies validation errors.
 */
export interface ApiErrorResponse {
    error: {
        status: string | number;
        message: string;
        data?: {
            invalidParamKeys: string[];
        };
    };
}
