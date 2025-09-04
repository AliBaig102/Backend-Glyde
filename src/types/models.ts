import { Types } from "mongoose";

export interface BaseModel {
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IRating {
  driverId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}
export interface IRideHistory {
  rideId: Types.ObjectId;
  driverId: Types.ObjectId;
  pickupLocation: ILocation;
  dropOffLocation: ILocation;
  status: 'COMPLETED' | 'CANCELLED';
  completedAt?: Date;
}

export interface IUser extends BaseModel {
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
    | 'NEED_EMAIL_VERIFICATION'
    | 'NEED_PASSWORD_RESET'
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
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): { code: string; expiresAt: Date };
  isOTPValid(code: string): boolean;
}