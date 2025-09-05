import { Request, Response } from 'express';
import { Document, Model } from 'mongoose';
import { ResponseUtil } from './response';

interface PaginatedOptions {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc';
  searchFields?: string[];
}
export class DatabaseUtil {
  public static async Paginated<T extends Document>(
    req: Request,
    res: Response,
    model: Model<T>,
    options: PaginatedOptions
  ): Promise<void> {
    try {
      const {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        searchFields = [],
      } = options;

      const searchQuery: any = {};
      if (search && searchFields.length > 0) {
        searchQuery.$or = searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' },
        }));
      }

      const sortOptions: any = { [sortBy!]: sortOrder === 'asc' ? 1 : -1 };

      const isPaginationRequested = 'page' in req.query || 'limit' in req.query;

      let results: T[];
      let totalCount: number;
      if (isPaginationRequested && page !== undefined && limit !== undefined) {
        const skip = (page! - 1) * limit!;
        [results, totalCount] = (await Promise.all([
          model
            .find(searchQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
          model.countDocuments(searchQuery),
        ])) as [T[], number];
        ResponseUtil.paginated(
          res,
          { [model.collection.collectionName]: results },
          totalCount,
          page,
          limit
        );
      } else {
        [results, totalCount] = (await Promise.all([
          model.find(searchQuery).sort(sortOptions).lean(),
          model.countDocuments(searchQuery),
        ])) as [T[], number];

        ResponseUtil.success(
          res,
          { [model.collection.collectionName]: results, total: totalCount },
          'Data retrieved successfully'
        );
      }
    } catch (error: any) {
      ResponseUtil.internalError(res, 'Failed to retrieve data', error);
    }
  }
}
