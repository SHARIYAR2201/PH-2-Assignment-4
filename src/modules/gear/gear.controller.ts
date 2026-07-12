import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { GearService } from './gear.service';

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await GearService.getAllPublic(req.query as Record<string, string>);
  sendResponse(res, {
    statusCode: 200,
    message: 'Gear items retrieved successfully.',
    data: result.items,
    meta: result.meta,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await GearService.getById(req.params.id as string);
  sendResponse(res, { statusCode: 200, message: 'Gear item retrieved successfully.', data: result });
});

export const GearController = { getAll, getById };
