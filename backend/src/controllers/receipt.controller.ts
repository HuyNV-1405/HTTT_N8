import { Request, Response } from 'express';
import { ReceiptService } from '../services/receipt.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { TrangThaiPhieu } from '@prisma/client';

export class ReceiptController {
  static async getAll(req: Request, res: Response) {
    try {
      const { khoId, trangThai } = req.query;
      const receipts = await ReceiptService.getAllReceipts({
        khoId: khoId as string,
        trangThai: trangThai as TrangThaiPhieu,
      });
      return sendSuccess(res, receipts, 'Lấy danh sách phiếu nhập kho thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await ReceiptService.getReceiptById(id);
      return sendSuccess(res, receipt, 'Lấy thông tin phiếu nhập kho thành công');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Chưa xác thực người dùng', 401);
      }
      const receipt = await ReceiptService.createReceipt(req.body, req.user.id);
      return sendSuccess(res, receipt, 'Lập phiếu nhập kho thành công', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async approve(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Chưa xác thực người dùng', 401);
      }
      const { id } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const approved = await ReceiptService.approveReceipt(id, req.user.id, ipAddress);
      return sendSuccess(res, approved, 'Phê duyệt và ghi sổ nhập kho thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async reject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Chưa xác thực người dùng', 401);
      }
      const { id } = req.params;
      const { lyDo } = req.body;
      const rejected = await ReceiptService.rejectReceipt(id, req.user.id, lyDo);
      return sendSuccess(res, rejected, 'Đã từ chối phiếu nhập kho');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

