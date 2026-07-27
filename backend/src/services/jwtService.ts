import crypto from 'crypto';

export interface JwtPayload {
  userId: number;
  familyId: number;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export class JwtService {
  private static readonly SECRET = process.env.JWT_SECRET || 'family_wealth_os_super_secret_jwt_key_2026';
  private static readonly ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  public static generateAccessToken(payload: JwtPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Date.now();
    const fullPayload: JwtPayload = {
      ...payload,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + this.ACCESS_TOKEN_EXPIRY_MS) / 1000)
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  public static verifyAccessToken(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload: JwtPayload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    return payload;
  }

  public static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
