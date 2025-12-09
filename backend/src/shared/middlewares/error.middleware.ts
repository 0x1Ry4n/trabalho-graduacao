import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../errors/error";
import SendResponse from "../utils/response.utils";

export const ErrorMiddleware = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        return SendResponse.error(res, err.statusCode, err.message);
    }

    if (err instanceof Error) {
        return SendResponse.error(res, StatusCodes.INTERNAL_SERVER_ERROR, "Erro interno do servidor", { error: [err.message] });
    }

    return SendResponse.error(res, StatusCodes.INTERNAL_SERVER_ERROR, "Erro interno do servidor");
};
