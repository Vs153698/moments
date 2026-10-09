import type { paths } from "./generated";

type HealthGet = NonNullable<paths["/v1/health"]["get"]>;
type MomentPost = NonNullable<paths["/v1/moments"]["post"]>;
type OtpRequestPost = NonNullable<paths["/v1/auth/otp/request"]["post"]>;
type OtpVerifyPost = NonNullable<paths["/v1/auth/otp/verify"]["post"]>;
type GooglePost = NonNullable<paths["/v1/auth/google"]["post"]>;
type ApplePost = NonNullable<paths["/v1/auth/apple"]["post"]>;

export type HealthResponse = HealthGet["responses"][200]["content"]["application/json"];
export type CreateMomentRequest = NonNullable<MomentPost["requestBody"]>["content"]["application/json"];
export type CreateMomentResponse =
  MomentPost["responses"][201]["content"]["application/json"];

export type RequestOtpRequest = NonNullable<OtpRequestPost["requestBody"]>["content"]["application/json"];
export type RequestOtpResponse = OtpRequestPost["responses"][200]["content"]["application/json"];

export type VerifyOtpRequest = NonNullable<OtpVerifyPost["requestBody"]>["content"]["application/json"];
export type VerifyOtpResponse = OtpVerifyPost["responses"][200]["content"]["application/json"];

export type SocialUser = NonNullable<
  GooglePost["responses"][200]["content"]["application/json"]["user"]
>;
export type GoogleSignInRequest = NonNullable<GooglePost["requestBody"]>["content"]["application/json"];
export type GoogleSignInResponse = GooglePost["responses"][200]["content"]["application/json"];

export type AppleSignInRequest = NonNullable<ApplePost["requestBody"]>["content"]["application/json"];
export type AppleSignInResponse = ApplePost["responses"][200]["content"]["application/json"];

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path?: string;
};

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiClientError";
  }
}

/** Minimal typed fetch client driven by the generated OpenAPI types (F6.1). */
export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  getHealth(): Promise<HealthResponse> {
    return this.request("GET", "/v1/health");
  }

  createMoment(input: CreateMomentRequest, idempotencyKey?: string): Promise<CreateMomentResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return this.request("POST", "/v1/moments", input, headers);
  }

  requestOtp(input: RequestOtpRequest): Promise<RequestOtpResponse> {
    return this.request("POST", "/v1/auth/otp/request", input);
  }

  verifyOtp(input: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return this.request("POST", "/v1/auth/otp/verify", input);
  }

  googleSignIn(input: GoogleSignInRequest): Promise<GoogleSignInResponse> {
    return this.request("POST", "/v1/auth/google", input);
  }

  appleSignIn(input: AppleSignInRequest): Promise<AppleSignInResponse> {
    return this.request("POST", "/v1/auth/apple", input);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      throw new ApiClientError(res.status, json as ApiErrorBody);
    }
    return json as T;
  }
}
