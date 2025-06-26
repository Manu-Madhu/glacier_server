import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Function to hash a password
export const hashPassword = async (plainPassword) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
};

export const comparePasswords = async (inputpwd, storedpwd) => {
    return await bcrypt.compare(inputpwd, storedpwd);
}

export const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
}