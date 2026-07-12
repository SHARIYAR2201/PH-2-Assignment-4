import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { RentalService } from './rental.service';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await RentalService.create(req.user!.userId, req.body);
  sendResponse(res, { statusCode: 201, message: 'Rental order placed successfully.', data: result });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await RentalService.getCustomerOrders(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Rental orders retrieved successfully.', data: result });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await RentalService.getOrderById(req.params.id as string, req.user!);
  sendResponse(res, { statusCode: 200, message: 'Rental order retrieved successfully.', data: result });
});

const cancel = catchAsync(async (req: Request, res: Response) => {
  const result = await RentalService.cancelByCustomer(req.params.id as string, req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Rental order cancelled successfully.', data: result });
});

export const RentalController = { create, getMyOrders, getById, cancel };
