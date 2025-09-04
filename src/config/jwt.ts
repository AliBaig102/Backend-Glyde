import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

/**
 * JWT configuration and token management
 */

export interface JWTPayload {
  userId: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JWTManager {
  private static instance: JWTManager;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  private constructor() {
    this.accessTokenSecret =
      process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-here';
    this.refreshTokenSecret =
      process.env['JWT_REFRESH_SECRET'] || 'your-super-secret-refresh-key-here';
    this.accessTokenExpiry = process.env['JWT_EXPIRES_IN'] || '7d';
    this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRES_IN'] || '30d';

    if (
      this.accessTokenSecret === 'your-super-secret-jwt-key-here' ||
      this.refreshTokenSecret === 'your-super-secret-refresh-key-here'
    ) {
      logger.warn(
        'Using default JWT secrets. Please set JWT_SECRET and JWT_REFRESH_SECRET in production.'
      );
    }
  }

  public static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager();
    }
    return JWTManager.instance;
  }

  public generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry as string | number,
        issuer: 'glyde-backend',
        audience: 'glyde-frontend',
      } as jwt.SignOptions);

      logger.info(`Access token generated for user: ${payload.userId}`);
      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  public generateRefreshToken(
    payload: Omit<JWTPayload, 'iat' | 'exp'>
  ): string {
    try {
      const token = jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry as string | number,
        issuer: 'glyde-backend',
        audience: 'glyde-frontend',
      } as jwt.SignOptions);

      logger.info(`Refresh token generated for user: ${payload.userId}`);
      return token;
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  public generateTokenPair(
    payload: Omit<JWTPayload, 'iat' | 'exp'>
  ): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  public verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'glyde-backend',
        audience: 'glyde-frontend',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        logger.error('Error verifying access token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  public verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'glyde-backend',
        audience: 'glyde-frontend',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  public decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  public getTokenExpirationTime(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  public refreshAccessToken(refreshToken: string): string {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      // Generate new access token with the same payload (excluding iat and exp)
      const newPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: decoded.userId,
      };

      if (decoded.role) {
        newPayload.role = decoded.role;
      }

      return this.generateAccessToken(newPayload);
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jwtManager = JWTManager.getInstance();

// Convenience functions
export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>) =>
  jwtManager.generateTokenPair(payload);

export const verifyToken = (token: string) =>
  jwtManager.verifyAccessToken(token);

export const verifyRefreshToken = (token: string) =>
  jwtManager.verifyRefreshToken(token);

export const refreshToken = (refreshToken: string) =>
  jwtManager.refreshAccessToken(refreshToken);

export const isExpired = (token: string) => jwtManager.isTokenExpired(token);

export const decodeJWT = (token: string) => jwtManager.decodeToken(token);
