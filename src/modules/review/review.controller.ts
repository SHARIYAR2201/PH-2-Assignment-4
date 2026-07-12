import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ReviewService } from './review.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.create(req.user!.userId, req.body);
  sendResponse(res, { statusCode: 201, message: 'Review submitted successfully.', data: result });
});

export const ReviewController = { create };
