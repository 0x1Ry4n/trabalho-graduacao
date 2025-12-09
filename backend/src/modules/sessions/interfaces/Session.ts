export interface Session {
    id: string;
    userId: number;
    refreshToken: string;
    expiresAt: Date;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}