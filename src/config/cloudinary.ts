import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

/**
 * Cloudinary configuration for file upload and management
 */

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure: boolean;
}

class CloudinaryManager {
  private static instance: CloudinaryManager;
  private isConfigured: boolean = false;

  private constructor() {
    this.configure();
  }

  public static getInstance(): CloudinaryManager {
    if (!CloudinaryManager.instance) {
      CloudinaryManager.instance = new CloudinaryManager();
    }
    return CloudinaryManager.instance;
  }

  private configure(): void {
    try {
      const config: CloudinaryConfig = {
        cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] || '',
        api_key: process.env['CLOUDINARY_API_KEY'] || '',
        api_secret: process.env['CLOUDINARY_API_SECRET'] || '',
        secure: true,
      };

      // Validate required configuration
      if (!config.cloud_name || !config.api_key || !config.api_secret) {
        logger.warn(
          'Cloudinary configuration incomplete. Some features may not work.'
        );
        return;
      }

      cloudinary.config(config);
      this.isConfigured = true;
      logger.info('Cloudinary configured successfully');
    } catch (error) {
      logger.error('Failed to configure Cloudinary:', error);
      throw error;
    }
  }

  public async uploadImage(
    buffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      transformation?: any;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
    } = {}
  ): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not properly configured');
    }

    try {
      const uploadOptions: any = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'glyde-backend',
        public_id: options.public_id,
        transformation: options.transformation || [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        ...options,
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              logger.info(`File uploaded successfully: ${result?.public_id}`);
              resolve(result);
            }
          })
          .end(buffer);
      });
    } catch (error) {
      logger.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  public async deleteImage(publicId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not properly configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`File deleted successfully: ${publicId}`);
      return result;
    } catch (error) {
      logger.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  }

  public async getImageDetails(publicId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not properly configured');
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error getting image details from Cloudinary:', error);
      throw error;
    }
  }

  public generateImageUrl(
    publicId: string,
    transformations: any[] = []
  ): string {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not properly configured');
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  public generateThumbnailUrl(
    publicId: string,
    width: number = 150,
    height: number = 150
  ): string {
    return this.generateImageUrl(publicId, [
      { width, height, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ]);
  }

  public isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const cloudinaryManager = CloudinaryManager.getInstance();

// Export cloudinary instance for direct access
export { cloudinary };

// Convenience functions
export const uploadToCloudinary = (buffer: Buffer, options?: any) =>
  cloudinaryManager.uploadImage(buffer, options);

export const deleteFromCloudinary = (publicId: string) =>
  cloudinaryManager.deleteImage(publicId);

export const getCloudinaryImageDetails = (publicId: string) =>
  cloudinaryManager.getImageDetails(publicId);

export const generateCloudinaryUrl = (
  publicId: string,
  transformations?: any[]
) => cloudinaryManager.generateImageUrl(publicId, transformations);

export const generateThumbnail = (
  publicId: string,
  width?: number,
  height?: number
) => cloudinaryManager.generateThumbnailUrl(publicId, width, height);
