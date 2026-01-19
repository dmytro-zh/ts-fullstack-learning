import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) return reject(err);
      resolve(hash);
    });
  });
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, passwordHash, (err, same) => {
      if (err) return reject(err);
      resolve(same);
    });
  });
}
