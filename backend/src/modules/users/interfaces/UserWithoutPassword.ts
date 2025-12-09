export interface UserWithoutPassword {
    id: number;
    username: string;
    email: string;
    role: string;
    active: number;
    createdAt: Date;
}