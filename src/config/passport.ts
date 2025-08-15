import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { logger } from '../utils/logger';
// import { User } from '@/models/user.model'; // Will be uncommented when User model is created

/**
 * Passport configuration for authentication strategies
 */

interface OAuthProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified?: boolean }>;
  photos: Array<{ value: string }>;
  provider: string;
}

class PassportManager {
  private static instance: PassportManager;

  private constructor() {}

  public static getInstance(): PassportManager {
    if (!PassportManager.instance) {
      PassportManager.instance = new PassportManager();
    }
    return PassportManager.instance;
  }

  public initialize(): void {
    this.setupJWTStrategy();
    this.setupGoogleStrategy();
    this.setupFacebookStrategy();
    this.setupGitHubStrategy();
    this.setupSerialization();

    logger.info('Passport strategies initialized successfully');
  }

  private setupJWTStrategy(): void {
    const jwtSecret =
      process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-here';

    passport.use(
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: jwtSecret,
          issuer: 'glyde-backend',
          audience: 'glyde-frontend',
        },
        async (payload: any, done: any) => {
          try {
            // TODO: Uncomment when User model is available
            // const user = await User.findById(payload.userId).select('-password');
            // if (user) {
            //   return done(null, user);
            // } else {
            //   return done(null, false);
            // }

            // Temporary implementation
            return done(null, { id: payload.userId, email: payload.email });
          } catch (error) {
            logger.error('JWT Strategy error:', error);
            return done(error, false);
          }
        }
      )
    );
  }

  private setupGoogleStrategy(): void {
    const clientID = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
    const callbackURL =
      process.env['GOOGLE_CALLBACK_URL'] ||
      'http://localhost:3000/api/v1/auth/google/callback';

    if (!clientID || !clientSecret) {
      logger.warn('Google OAuth credentials not configured');
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          scope: ['profile', 'email'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: any,
          done: any
        ) => {
          try {
            const oauthProfile: OAuthProfile = {
              id: profile.id,
              displayName: profile.displayName,
              emails: profile.emails || [],
              photos: profile.photos || [],
              provider: 'google',
            };

            const user = await this.handleOAuthUser(oauthProfile);
            return done(null, user);
          } catch (error) {
            logger.error('Google Strategy error:', error);
            return done(error, null);
          }
        }
      )
    );
  }

  private setupFacebookStrategy(): void {
    const clientID = process.env['FACEBOOK_APP_ID'];
    const clientSecret = process.env['FACEBOOK_APP_SECRET'];
    const callbackURL =
      process.env['FACEBOOK_CALLBACK_URL'] ||
      'http://localhost:3000/api/v1/auth/facebook/callback';

    if (!clientID || !clientSecret) {
      logger.warn('Facebook OAuth credentials not configured');
      return;
    }

    passport.use(
      new FacebookStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          profileFields: ['id', 'displayName', 'emails', 'photos'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: any,
          done: any
        ) => {
          try {
            const oauthProfile: OAuthProfile = {
              id: profile.id,
              displayName: profile.displayName,
              emails: profile.emails || [],
              photos: profile.photos || [],
              provider: 'facebook',
            };

            const user = await this.handleOAuthUser(oauthProfile);
            return done(null, user);
          } catch (error) {
            logger.error('Facebook Strategy error:', error);
            return done(error, null);
          }
        }
      )
    );
  }

  private setupGitHubStrategy(): void {
    const clientID = process.env['GITHUB_CLIENT_ID'];
    const clientSecret = process.env['GITHUB_CLIENT_SECRET'];
    const callbackURL =
      process.env['GITHUB_CALLBACK_URL'] ||
      'http://localhost:3000/api/v1/auth/github/callback';

    if (!clientID || !clientSecret) {
      logger.warn('GitHub OAuth credentials not configured');
      return;
    }

    passport.use(
      new GitHubStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          scope: ['user:email'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: any,
          done: any
        ) => {
          try {
            const oauthProfile: OAuthProfile = {
              id: profile.id,
              displayName: profile.displayName || profile.username,
              emails: profile.emails || [],
              photos: profile.photos || [],
              provider: 'github',
            };

            const user = await this.handleOAuthUser(oauthProfile);
            return done(null, user);
          } catch (error) {
            logger.error('GitHub Strategy error:', error);
            return done(error, null);
          }
        }
      )
    );
  }

  private setupSerialization(): void {
    passport.serializeUser((user: any, done: any) => {
      done(null, user.id || user._id);
    });

    passport.deserializeUser(async (id: string, done: any) => {
      try {
        // TODO: Uncomment when User model is available
        // const user = await User.findById(id).select('-password');
        // done(null, user);

        // Temporary implementation
        done(null, { id });
      } catch (error) {
        logger.error('Deserialize user error:', error);
        done(error, null);
      }
    });
  }

  private async handleOAuthUser(profile: OAuthProfile): Promise<any> {
    try {
      // TODO: Implement user creation/retrieval logic when User model is available
      // const email = profile.emails[0]?.value;
      // if (!email) {
      //   throw new Error('No email provided by OAuth provider');
      // }

      // // Check if user exists
      // let user = await User.findOne({
      //   $or: [
      //     { email },
      //     { [`oauth.${profile.provider}.id`]: profile.id }
      //   ]
      // });

      // if (user) {
      //   // Update OAuth info if user exists
      //   user.oauth = user.oauth || {};
      //   user.oauth[profile.provider] = {
      //     id: profile.id,
      //     email,
      //     displayName: profile.displayName,
      //     photo: profile.photos[0]?.value,
      //   };
      //   await user.save();
      // } else {
      //   // Create new user
      //   user = new User({
      //     email,
      //     name: profile.displayName,
      //     avatar: profile.photos[0]?.value,
      //     isEmailVerified: true,
      //     oauth: {
      //       [profile.provider]: {
      //         id: profile.id,
      //         email,
      //         displayName: profile.displayName,
      //         photo: profile.photos[0]?.value,
      //       }
      //     }
      //   });
      //   await user.save();
      // }

      // return user;

      // Temporary implementation
      return {
        id: profile.id,
        email: profile.emails[0]?.value,
        name: profile.displayName,
        provider: profile.provider,
      };
    } catch (error) {
      logger.error('Error handling OAuth user:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const passportManager = PassportManager.getInstance();

// Convenience function
export const setupPassport = () => passportManager.initialize();

// Export passport instance
export { passport };
