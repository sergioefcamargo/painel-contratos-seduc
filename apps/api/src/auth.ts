import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'seduc-dev-secret-change-in-prod';
const EXPIRES = '7d';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
