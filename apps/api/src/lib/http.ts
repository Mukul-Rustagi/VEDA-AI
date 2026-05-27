import type { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler<
  TReq extends Request = Request,
  TRes extends Response = Response
>(
  handler: (
    req: TReq,
    res: TRes,
    next: NextFunction
  ) => Promise<void> | Promise<Response>
) {
  return (req: TReq, res: TRes, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "Route not found"));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  const message =
    error instanceof Error ? error.message : "Something went wrong";

  res.status(500).json({ message });
}
