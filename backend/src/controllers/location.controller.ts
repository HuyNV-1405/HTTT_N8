import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { TrangThaiViTri } from '@prisma/client';

export class LocationController {
  static async getWarehouses(req: Request, res: Response) {
    try {
      const warehouses = await LocationService.getAllWarehouses();
      return sendSuccess(res, warehouses, 'Lấy danh sách kho hàng thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getLocations(req: Request, res: Response) {
    try {
      const { khoId, khuVucId, trangThai } = req.query;
      const locations = await LocationService.getLocations({
        khoId: khoId as string,
        khuVucId: khuVucId as string,
        trangThai: trangThai as TrangThaiViTri,
      });
      return sendSuccess(res, locations, 'Lấy danh sách vị trí lưu trữ thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async createLocation(req: Request, res: Response) {
    try {
      const location = await LocationService.createLocation(req.body);
      return sendSuccess(res, location, 'Tạo vị trí lưu trữ thành công', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { trangThai } = req.body;
      const updated = await LocationService.updateLocationStatus(id, trangThai);
      return sendSuccess(res, updated, 'Cập nhật trạng thái vị trí thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

