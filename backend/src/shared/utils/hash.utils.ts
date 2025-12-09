import { envConfig } from '../../config/env/env.config';
import bcrypt from 'bcryptjs';

export const generateHash = (text: string): Promise<string> => {
    return bcrypt.hash(text, envConfig.auth.hashSaltRounds);
}

export const compareHash = (text: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(text, hash);
}