import prisma from '../config/prisma';
import { Role, TrangThaiPhieu } from '@prisma/client';

export interface NotificationItem {
  id: string;
  type: 'DISPATCH_APPROVED' | 'DISPATCH_REJECTED' | 'DISPATCH_PENDING' | 'RECEIPT_APPROVED' | 'RECEIPT_REJECTED' | 'RECEIPT_PENDING';
  title: string;
  message: string;
  targetTab: 'dispatches' | 'receipts';
  targetId: string;
  targetCode: string;
  status: string;
  createdAt: string;
  actor?: string;
}

export class NotificationService {
  static async getNotificationsForUser(userId: string, role: Role): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    const isAdminOrManager = role === Role.ADMIN || role === Role.QUAN_LY_KHO;

    // 1. Lấy phiếu xuất kho do người này lập đã được duyệt hoặc từ chối
    const userDispatches = await prisma.phieuXuatKho.findMany({
      where: {
        nguoiLapId: userId,
        trangThai: { in: [TrangThaiPhieu.APPROVED, TrangThaiPhieu.REJECTED] },
      },
      include: {
        nguoiDuyet: { select: { hoTen: true } },
        khachHang: { select: { tenKH: true } },
      },
      orderBy: { ngayCapNhat: 'desc' },
      take: 15,
    });

    for (const d of userDispatches) {
      const isApproved = d.trangThai === TrangThaiPhieu.APPROVED;
      const actorName = d.nguoiDuyet?.hoTen || 'Quản lý kho';
      notifications.push({
        id: `dispatch-${d.id}-${d.trangThai}`,
        type: isApproved ? 'DISPATCH_APPROVED' : 'DISPATCH_REJECTED',
        title: isApproved ? `Phiếu xuất ${d.maPX} đã được phê duyệt` : `Phiếu xuất ${d.maPX} đã bị từ chối`,
        message: isApproved
          ? `${actorName} đã phê duyệt phiếu xuất kho giao cho "${d.khachHang?.tenKH}". Hàng đã được trừ tồn kho thành công.`
          : `${actorName} đã từ chối yêu cầu xuất kho.${d.ghiChu ? ` Lý do: ${d.ghiChu}` : ''}`,
        targetTab: 'dispatches',
        targetId: d.id,
        targetCode: d.maPX,
        status: d.trangThai,
        createdAt: (d.ngayDuyet || d.ngayCapNhat).toISOString(),
        actor: actorName,
      });
    }

    // 2. Lấy phiếu nhập kho do người này lập đã được duyệt hoặc từ chối
    const userReceipts = await prisma.phieuNhapKho.findMany({
      where: {
        nguoiLapId: userId,
        trangThai: { in: [TrangThaiPhieu.APPROVED, TrangThaiPhieu.REJECTED] },
      },
      include: {
        nguoiDuyet: { select: { hoTen: true } },
        nhaCungCap: { select: { tenNCC: true } },
      },
      orderBy: { ngayCapNhat: 'desc' },
      take: 15,
    });

    for (const r of userReceipts) {
      const isApproved = r.trangThai === TrangThaiPhieu.APPROVED;
      const actorName = r.nguoiDuyet?.hoTen || 'Quản lý kho';
      notifications.push({
        id: `receipt-${r.id}-${r.trangThai}`,
        type: isApproved ? 'RECEIPT_APPROVED' : 'RECEIPT_REJECTED',
        title: isApproved ? `Phiếu nhập ${r.maPN} đã được phê duyệt` : `Phiếu nhập ${r.maPN} đã bị từ chối`,
        message: isApproved
          ? `${actorName} đã phê duyệt phiếu nhập từ NCC "${r.nhaCungCap?.tenNCC}". Đã tự động ghi sổ cộng tồn kho.`
          : `${actorName} đã từ chối yêu cầu nhập kho.${r.ghiChu ? ` Lý do: ${r.ghiChu}` : ''}`,
        targetTab: 'receipts',
        targetId: r.id,
        targetCode: r.maPN,
        status: r.trangThai,
        createdAt: (r.ngayDuyet || r.ngayCapNhat).toISOString(),
        actor: actorName,
      });
    }

    // 3. Nếu là Admin hoặc Quản lý kho, hiển thị các phiếu PENDING mới cần duyệt
    if (isAdminOrManager) {
      const pendingDispatches = await prisma.phieuXuatKho.findMany({
        where: { trangThai: TrangThaiPhieu.PENDING },
        include: {
          nguoiLap: { select: { hoTen: true } },
          khachHang: { select: { tenKH: true } },
        },
        orderBy: { ngayTao: 'desc' },
        take: 10,
      });

      for (const d of pendingDispatches) {
        notifications.push({
          id: `pending-dispatch-${d.id}`,
          type: 'DISPATCH_PENDING',
          title: `Yêu cầu xuất kho mới: ${d.maPX}`,
          message: `${d.nguoiLap?.hoTen || 'Nhân viên'} vừa gửi yêu cầu xuất kho cho "${d.khachHang?.tenKH}". Cần bạn kiểm tra và phê duyệt.`,
          targetTab: 'dispatches',
          targetId: d.id,
          targetCode: d.maPX,
          status: d.trangThai,
          createdAt: d.ngayTao.toISOString(),
          actor: d.nguoiLap?.hoTen,
        });
      }

      const pendingReceipts = await prisma.phieuNhapKho.findMany({
        where: { trangThai: TrangThaiPhieu.PENDING },
        include: {
          nguoiLap: { select: { hoTen: true } },
          nhaCungCap: { select: { tenNCC: true } },
        },
        orderBy: { ngayTao: 'desc' },
        take: 10,
      });

      for (const r of pendingReceipts) {
        notifications.push({
          id: `pending-receipt-${r.id}`,
          type: 'RECEIPT_PENDING',
          title: `Yêu cầu nhập kho mới: ${r.maPN}`,
          message: `${r.nguoiLap?.hoTen || 'Nhân viên'} vừa gửi yêu cầu nhập kho từ "${r.nhaCungCap?.tenNCC}". Cần bạn kiểm tra và phê duyệt.`,
          targetTab: 'receipts',
          targetId: r.id,
          targetCode: r.maPN,
          status: r.trangThai,
          createdAt: r.ngayTao.toISOString(),
          actor: r.nguoiLap?.hoTen,
        });
      }
    }

    // Sắp xếp theo thời gian mới nhất
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return notifications.slice(0, 20);
  }
}
