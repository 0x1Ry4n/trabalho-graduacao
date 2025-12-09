import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { logger } from "../utils/logger.utils";
import SendResponse from "../utils/response.utils";

type ValidateTarget = "body" | "params" | "query";
type ValidationErrors = Record<string, string[]>;

export const SchemaValidatorMiddleware =
    (schema: ZodTypeAny, target: ValidateTarget = "body") =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                req[target] = schema.parse(req[target]);
                return next();
            } catch (error) {
                if (error instanceof ZodError) {
                    const errors: ValidationErrors = {};

                    for (const issue of error.issues) {
                        const path = issue.path.join(".") || "root";
                        if (!errors[path]) errors[path] = [];
                        errors[path].push(issue.message);
                    }

                    return SendResponse.validationErrors(res, errors);
                }

                logger.error(`Erro interno ao validar os dados: ${error}`);

                return SendResponse.internalServerError(
                    res,
                    "Erro interno ao validar os dados"
                );
            }
        };