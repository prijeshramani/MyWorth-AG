import { SQLiteUserRepository } from '../repositories/SQLiteUserRepository';
import { SQLiteAuditRepository } from '../repositories/SQLiteAuditRepository';
import { PasswordService } from './passwordService';
import { JwtService, JwtPayload } from './jwtService';
import crypto from 'crypto';

export interface LoginResultDTO {
  user: {
    id: number;
    familyId: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export class AuthenticationService {
  constructor(
    private userRepo: SQLiteUserRepository,
    private auditRepo: SQLiteAuditRepository
  ) {}

  public login(email: string, password: string, ipAddress?: string, correlationId?: string): LoginResultDTO {
    const user = this.userRepo.findByEmail(email);
    if (!user) {
      this.auditRepo.log({
        action: 'USER_LOGIN_FAILED',
        entity_type: 'USER',
        before_state: JSON.stringify({ email }),
        ip_address: ipAddress,
        correlation_id: correlationId
      });
      throw new Error('Invalid email or password credentials.');
    }

    const isMatch = PasswordService.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      this.auditRepo.log({
        user_id: user.id,
        family_id: user.family_id,
        action: 'USER_LOGIN_FAILED',
        entity_type: 'USER',
        entity_id: user.id.toString(),
        ip_address: ipAddress,
        correlation_id: correlationId
      });
      throw new Error('Invalid email or password credentials.');
    }

    const roles = this.userRepo.getUserRoles(user.id);
    const permissions = this.userRepo.getUserPermissions(user.id);

    const jwtPayload: JwtPayload = {
      userId: user.id,
      familyId: user.family_id,
      email: user.email,
      roles,
      permissions
    };

    const accessToken = JwtService.generateAccessToken(jwtPayload);
    const refreshToken = JwtService.generateRefreshToken();
    const sessionId = crypto.randomUUID();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.userRepo.createSession({
      id: sessionId,
      user_id: user.id,
      refresh_token: refreshToken,
      ip_address: ipAddress,
      expires_at: expiresAt
    });

    this.auditRepo.log({
      user_id: user.id,
      family_id: user.family_id,
      action: 'USER_LOGIN_SUCCESS',
      entity_type: 'USER',
      entity_id: user.id.toString(),
      ip_address: ipAddress,
      correlation_id: correlationId
    });

    return {
      user: {
        id: user.id,
        familyId: user.family_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles,
        permissions
      },
      accessToken,
      refreshToken,
      expiresInSeconds: 900 // 15 minutes
    };
  }

  public refreshToken(refreshTokenStr: string): { accessToken: string } {
    const session = this.userRepo.findSessionByRefreshToken(refreshTokenStr);
    if (!session || new Date() > new Date(session.expires_at)) {
      throw new Error('Invalid or expired refresh token.');
    }

    const user = this.userRepo.findById(session.user_id);
    if (!user) {
      throw new Error('User associated with session not found.');
    }

    const roles = this.userRepo.getUserRoles(user.id);
    const permissions = this.userRepo.getUserPermissions(user.id);

    const accessToken = JwtService.generateAccessToken({
      userId: user.id,
      familyId: user.family_id,
      email: user.email,
      roles,
      permissions
    });

    return { accessToken };
  }

  public logout(refreshTokenStr: string): void {
    const session = this.userRepo.findSessionByRefreshToken(refreshTokenStr);
    if (session) {
      this.userRepo.revokeSession(session.id);
    }
  }
}
