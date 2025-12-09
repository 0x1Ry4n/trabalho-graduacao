import { z } from 'zod';

export const userLoginSchema = z.object({
    email: z.email("Email inválido").max(255, "O email não pode ter mais de 255 caracteres"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100, "A senha não pode exceder 100 caracteres"),
});
