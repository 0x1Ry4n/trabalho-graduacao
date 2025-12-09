import { StatusCodes } from "http-status-codes";
import { Response } from "express";

type ApiResponse<T = unknown> = {
    ok: boolean;
    message: string;
    data?: T;
    pagination?: unknown;
    errors?: Record<string, string[]>;
};

class SendResponse {
    private static send<T>(
        res: Response,
        status: number,
        payload?: ApiResponse<T>
    ) {
        if (status === StatusCodes.NO_CONTENT) {
            return res.sendStatus(status);
        }

        return res.status(status).json(payload);
    }

    static success<T>(
        res: Response,
        data?: T,
        message = "Success"
    ) {
        return this.send(res, StatusCodes.OK, {
            ok: true,
            message,
            data,
        });
    }

    static created<T>(
        res: Response,
        data?: T,
        message = "Created"
    ) {
        return this.send(res, StatusCodes.CREATED, {
            ok: true,
            message,
            data,
        });
    }

    static paginated<T>(
        res: Response,
        payload: { data: T[]; pagination: unknown },
        message = "Success"
    ) {
        return this.send(res, StatusCodes.OK, {
            ok: true,
            message,
            data: payload.data,
            pagination: payload.pagination,
        });
    }

    static noContent(res: Response) {
        return this.send(res, StatusCodes.NO_CONTENT);
    }

    static error(
        res: Response,
        status: number,
        message: string,
        errors?: Record<string, string[]>
    ) {
        return this.send(res, status, {
            ok: false,
            message,
            errors,
        });
    }

    static badRequest(
        res: Response,
        errors?: Record<string, string[]>,
        message = "Bad request"
    ) {
        return this.error(res, StatusCodes.BAD_REQUEST, message, errors);
    }

    static unauthorized(res: Response, message = "Unauthorized") {
        return this.error(res, StatusCodes.UNAUTHORIZED, message);
    }

    static forbidden(res: Response, message = "Forbidden") {
        return this.error(res, StatusCodes.FORBIDDEN, message);
    }

    static notFound(res: Response, message = "Not found") {
        return this.error(res, StatusCodes.NOT_FOUND, message);
    }

    static validationErrors(
        res: Response,
        errors: Record<string, string[]>
    ) {
        return this.error(
            res,
            StatusCodes.UNPROCESSABLE_ENTITY,
            "Validation error",
            errors
        );
    }

    static internalServerError(
        res: Response,
        message = "Internal server error"
    ) {
        return this.error(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            message
        );
    }
}

export default SendResponse;
