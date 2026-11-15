import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class InventoryController {
  static async getInventory(req: Request, res: Response) {
    try {
      const { khoId, hangHoaId, viTriId, search } = req.query;
      const inventory = await InventoryService.getInventory({
        khoId: khoId as string,
        hangHoaId: hangHoaId as string,
        viTriId: viTriId as string,
        search: search as string,
      });
      return sendSuccess(res, inventory, 'Tra cứu tồn kho thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getDashboard(req: Request, res: Response) {
    try {
      const dashboard = await InventoryService.getDashboardStats();
      return sendSuccess(res, dashboard, 'Lấy số liệu thống kê Dashboard thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getAlerts(req: Request, res: Response) {
    try {
      const { khoId } = req.query;
      const alerts = await InventoryService.getAlerts(khoId as string);
      return sendSuccess(res, alerts, 'Lấy danh sách cảnh báo tồn kho thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async resolveAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resolved = await InventoryService.resolveAlert(id);
      return sendSuccess(res, resolved, 'Đã đánh dấu xử lý cảnh báo tồn kho');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getAuditLogs(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await InventoryService.getAuditLogs(limit);
      return sendSuccess(res, logs, 'Lấy lịch sử thao tác thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async adjustStock(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Chưa xác thực người dùng', 401);
      }
      const { hangHoaId, viTriId, khoId, soLuongMoi, lyDo, dieuChinhTongTon } = req.body;
      if (!hangHoaId || soLuongMoi === undefined) {
        return sendError(res, 'Vui lòng cung cấp hangHoaId và soLuongMoi', 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await InventoryService.adjustStock(
        {
          hangHoaId,
          viTriId,
          khoId,
          soLuongMoi: Number(soLuongMoi),
          lyDo: lyDo || 'Điều chỉnh tồn kho kiểm kê',
          dieuChinhTongTon: Boolean(dieuChinhTongTon),
        },
        req.user.id,
        ipAddress
      );

      return sendSuccess(res, result, 'Điều chỉnh tồn kho thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

