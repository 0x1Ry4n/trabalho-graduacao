import { StatusCodes } from "http-status-codes";

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode = StatusCodes.BAD_REQUEST
  ) {
    super(message);
  }
}
