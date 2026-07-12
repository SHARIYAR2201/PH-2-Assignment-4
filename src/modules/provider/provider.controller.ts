import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { GearService } from '../gear/gear.service';
import { RentalService } from '../rental/rental.service';

const addGear = catchAsync(async (req: Request, res: Response) => {
  const result = await GearService.createForProvider(req.user!.userId, req.body);
  sendResponse(res, { statusCode: 201, message: 'Gear item added to inventory.', data: result });
});

const getMyInventory = catchAsync(async (req: Request, res: Response) => {
  const result = await GearService.getProviderInventory(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Inventory retrieved successfully.', data: result });
});

const updateGear = catchAsync(async (req: Request, res: Response) => {
  const result = await GearService.updateForProvider(req.params.id as string, req.user!.userId, req.body);
  sendResponse(res, { statusCode: 200, message: 'Gear item updated successfully.', data: result });
});

const removeGear = catchAsync(async (req: Request, res: Response) => {
  await GearService.removeForProvider(req.params.id as string, req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Gear item removed from inventory.', data: null });
});

const getIncomingOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await RentalService.getProviderOrders(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Incoming orders retrieved successfully.', data: result });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await RentalService.updateStatusByProvider(
    req.params.id as string,
    req.user!.userId,
    req.body.status
  );
  sendResponse(res, { statusCode: 200, message: 'Rental order status updated.', data: result });
});

export const ProviderController = {
  addGear,
  getMyInventory,
  updateGear,
  removeGear,
  getIncomingOrders,
  updateOrderStatus,
};
