import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  LoggerService,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { reportException } from "./sentry";

export interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path?: string;
  requestId?: string;
}

/** Global error shape: { statusCode, code, message, details, path, requestId }. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const body = this.toBody(exception, req);
    if (body.statusCode >= 500) {
      reportException(exception);
      this.logger.error(exception instanceof Error ? exception.message : String(exception), {
        path: req.url,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown, req: Request): ErrorBody {
    const path = req.url;
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      // Already-shaped error bodies (e.g. thrown by the Zod pipe) pass through.
      if (typeof raw === "object" && raw !== null && "code" in raw && "message" in raw) {
        const shaped = raw as Omit<ErrorBody, "statusCode" | "path">;
        return { statusCode: status, path, ...shaped };
      }
      return {
        statusCode: status,
        code: HttpStatus[status] ?? "HTTP_ERROR",
        message: typeof raw === "string" ? raw : exception.message,
        path,
      };
    }
    return {
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      path,
    };
  }
}
