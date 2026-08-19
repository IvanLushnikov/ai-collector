import { hash, verify } from 'argon2';

export const hashPassword = async (plain: string): Promise<string> => {
  return hash(plain, {
    type: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
};

export const verifyPassword = async (passwordHash: string, plain: string): Promise<boolean> => {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
};
