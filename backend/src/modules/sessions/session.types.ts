export type UserSession = {
    userId: number;
    refreshToken: string;
    expiresAt: Date;
}