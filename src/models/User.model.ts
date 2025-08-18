/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Document, Model, Schema, Types, model } from 'mongoose';
import bcrypt from 'bcryptjs';

interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

interface IRating {
  driverId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}
interface IRideHistory {
  rideId: Types.ObjectId;
  driverId: Types.ObjectId;
  pickupLocation: ILocation;
  dropOffLocation: ILocation;
  status: 'COMPLETED' | 'CANCELLED';
  completedAt?: Date;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  phone?: string;
  googleId?: string;
  signupMethod: 'EMAIL' | 'PHONE' | 'GOOGLE';
  role: 'USER' | 'ADMIN' | 'DEVELOPER';
  otp?: {
    code: string;
    expiresAt: Date;
  };
  status:
    | 'NEED_PHONE_VERIFICATION'
    | 'TEMPORARY_BLOCKED'
    | 'BLOCKED'
    | 'ACTIVE';
  blockedAt?: Date;
  image?: string;
  location: ILocation;
  ratings?: IRating[];
  averageRating?: number;
  totalRides: number;
  rideHistory?: IRideHistory[];
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): { code: string; expiresAt: Date };
  isOTPValid(code: string): boolean;
}

export interface IUserModel extends Model<IUser> {
  findByEmailOrPhone(identifier: string): Promise<IUser | null>;
}

// Location schema
const LocationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
    default: [0, 0],
  },
});

// Rating schema
const RatingSchema = new Schema<IRating>({
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ride history schema
const RideHistorySchema = new Schema<IRideHistory>({
  rideId: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  pickupLocation: {
    type: LocationSchema,
    required: true,
  },
  dropOffLocation: {
    type: LocationSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'CANCELLED'],
    required: true,
  },
  completedAt: {
    type: Date,
  },
});

// User schema
const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address',
      },
      sparse: true,
    },
    password: {
      type: String,
      minlength: 6,
      validate: {
        validator: function (this: IUser, v: string) {
          // Password required for email signup
          if (this.signupMethod === 'EMAIL' && !v) {
            return false;
          }
          return true;
        },
        message: 'Password is required for email signup',
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: 'Please enter a valid phone number',
      },
      sparse: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    signupMethod: {
      type: String,
      enum: ['EMAIL', 'PHONE', 'GOOGLE'],
      required: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'DEVELOPER'],
      default: 'USER',
    },
    otp: {
      code: {
        type: String,
      },
      expiresAt: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: [
        'NEED_PHONE_VERIFICATION',
        'TEMPORARY_BLOCKED',
        'BLOCKED',
        'ACTIVE',
      ],
      default: function (this: IUser) {
        return this.signupMethod === 'PHONE'
          ? 'NEED_PHONE_VERIFICATION'
          : 'ACTIVE';
      },
    },
    blockedAt: {
      type: Date,
    },
    image: {
      type: String,
      default: '',
    },
    location: {
      type: LocationSchema,
    },
    ratings: [RatingSchema],
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRides: {
      type: Number,
      default: 0,
      min: 0,
    },
    rideHistory: [RideHistorySchema],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.otp;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ email: 1 }, { sparse: true, unique: true });
UserSchema.index({ phone: 1 }, { sparse: true, unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true, unique: true });
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ status: 1 });
UserSchema.index({ signupMethod: 1 });

// Pre-save middleware for password hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware for average rating calculation
UserSchema.pre('save', function (next) {
  if (this.isModified('ratings') && this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = sum / this.ratings.length;
  }
  next();
});

// Instance method to compare password
UserSchema.methods['comparePassword'] = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this['password']) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this['password']);
};

// Instance method to generate OTP
UserSchema.methods['generateOTP'] = function (): {
  code: string;
  expiresAt: Date;
} {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  this['otp'] = { code, expiresAt };
  return { code, expiresAt };
};

// Instance method to validate OTP
UserSchema.methods['isOTPValid'] = function (code: string): boolean {
  if (!this['otp'] || !this['otp'].code || !this['otp'].expiresAt) {
    return false;
  }

  if (this['otp'].expiresAt < new Date()) {
    return false;
  }

  return this['otp'].code === code;
};

// Static method to find user by email or phone
UserSchema.statics['findByEmailOrPhone'] = function (identifier: string) {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const query = isEmail ? { email: identifier } : { phone: identifier };
  return this.findOne(query);
};

// Validation for signup method requirements
UserSchema.pre('validate', function (next) {
  if (this.signupMethod === 'EMAIL' && !this.email) {
    this.invalidate('email', 'Email is required for email signup');
  }

  if (this.signupMethod === 'PHONE' && !this.phone) {
    this.invalidate('phone', 'Phone is required for phone signup');
  }

  if (this.signupMethod === 'GOOGLE' && !this.email) {
    this.invalidate('email', 'Email is required for Google signup');
  }

  next();
});

export const User = model<IUser, IUserModel>('User', UserSchema);
export default User;
