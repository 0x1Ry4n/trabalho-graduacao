export interface Auth {
    accessToken: string;
    accessExpiresIn: number | string;
    refreshToken?: string;
    refreshExpiresIn?: number | string;
    user: {
        id: number;
        username: string;
        email: string;
    }
}