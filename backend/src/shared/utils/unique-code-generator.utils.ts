import { customAlphabet } from "nanoid";

export function generateUniqueCode(length: number = 12): string {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const nanoid = customAlphabet(alphabet, length);

    return nanoid();
}