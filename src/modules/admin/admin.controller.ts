import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AdminService } from './admin.service';

const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getAllUsers();
  sendResponse(res, { statusCode: 200, message: 'Users retrieved successfully.', data: result });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(req.params.id as string, req.body.status);
  sendResponse(res, { statusCode: 200, message: 'User status updated successfully.', data: result });
});

const getAllGear = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getAllGear();
  sendResponse(res, { statusCode: 200, message: 'Gear listings retrieved successfully.', data: result });
});

const getAllRentals = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getAllRentals();
  sendResponse(res, { statusCode: 200, message: 'Rental orders retrieved successfully.', data: result });
});

export const AdminController = { getAllUsers, updateUserStatus, getAllGear, getAllRentals };
