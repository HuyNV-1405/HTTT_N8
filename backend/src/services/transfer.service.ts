import prisma from '../config/prisma';
import { TrangThaiPhieu, LoaiChuyenKho, TrangThaiViTri } from '@prisma/client';
import { generateTransferCode } from '../utils/code-generator.util';

export interface CreateTransferItemDto {
  hangHoaId: string;
  viTriDiId: string;
  viTriDenId: string;
  slChuyen: number;
  ghiChu?: string;
}

export interface CreateTransferDto {
  khoNguonId: string;
  khoDichId: string;
  loaiChuyen?: LoaiChuyenKho;
  ghiChu?: string;
  items: CreateTransferItemDto[];
}

export class TransferService {
  static async getAllTransfers(query: { khoNguonId?: string; khoDichId?: string; trangThai?: TrangThaiPhieu }) {
    const where: any = {};
    if (query.khoNguonId) where.khoNguonId = query.khoNguonId;
    if (query.khoDichId) where.khoDichId = query.khoDichId;
    if (query.trangThai) where.trangThai = query.trangThai;

    return prisma.phieuChuyenKho.findMany({
      where,
      include: {
        khoNguon: true,
        khoDich: true,
        nguoiLap: { select: { id: true, maNV: true, hoTen: true, username: true } },
        nguoiDuyet: { select: { id: true, maNV: true, hoTen: true, username: true } },
        chiTiet: {
          include: {
            hangHoa: true,
            viTriDi: true,
            viTriDen: true,
          },
        },
      },
      orderBy: { ngayTao: 'desc' },
    });
  }

  static async getTransferById(id: string) {
    const transfer = await prisma.phieuChuyenKho.findUnique({
      where: { id },
      include: {
        khoNguon: true,
        khoDich: true,
        nguoiLap: { select: { id: true, maNV: true, hoTen: true, username: true } },
        nguoiDuyet: { select: { id: true, maNV: true, hoTen: true, username: true } },
        chiTiet: {
          include: {
            hangHoa: true,
            viTriDi: true,
            viTriDen: true,
          },
        },
      },
    });

    if (!transfer) throw new Error('Không tìm thấy phiếu chuyển kho');
    return transfer;
  }

  static async createTransfer(data: CreateTransferDto, userId: string) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Phiếu chuyển kho phải có ít nhất 1 mặt hàng chi tiết');
    }

    const maPC = await generateTransferCode();
    const loaiChuyen = data.khoNguonId === data.khoDichId ? LoaiChuyenKho.NOI_BO_KHO : (data.loaiChuyen || LoaiChuyenKho.LIEN_KHO);

    const transfer = await prisma.phieuChuyenKho.create({
      data: {
        maPC,
        loaiChuyen,
        khoNguonId: data.khoNguonId,
        khoDichId: data.khoDichId,
        nguoiLapId: userId,
        trangThai: TrangThaiPhieu.PENDING,
        ghiChu: data.ghiChu,
        chiTiet: {
          create: data.items.map((i) => ({
            hangHoaId: i.hangHoaId,
            viTriDiId: i.viTriDiId,
            viTriDenId: i.viTriDenId,
            slChuyen: i.slChuyen,
            ghiChu: i.ghiChu,
          })),
        },
      },
      include: { chiTiet: true },
    });

    await prisma.lichSuThaoTac.create({
      data: {
        nguoiDungId: userId,
        loaiThaoTac: 'TAO_PHIEU_CHUYEN_KHO',
        doiTuong: 'PhieuChuyenKho',
        doiTuongId: transfer.id,
        noiDung: `Lập yêu cầu chuyển kho ${maPC} với ${data.items.length} mặt hàng`,
      },
    });

    return transfer;
  }

  // PHÊ DUYỆT CHUYỂN KHO (DATABASE TRANSACTION: TRỪ NGUỒN, CỘNG ĐÍCH)
  static async approveTransfer(id: string, userId: string, ipAddress?: string) {
    const transfer = await prisma.phieuChuyenKho.findUnique({
      where: { id },
      include: {
        chiTiet: {
          include: {
            hangHoa: true,
            viTriDi: true,
            viTriDen: true,
          },
        },
      },
    });

    if (!transfer) throw new Error('Không tìm thấy phiếu chuyển kho');
    if (transfer.trangThai !== TrangThaiPhieu.PENDING) {
      throw new Error(`Phiếu chuyển ${transfer.maPC} không ở trạng thái Chờ duyệt`);
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of transfer.chiTiet) {
        // 1. Kiểm tra và trừ tồn kho tại vị trí xuất đi (Kho nguồn)
        const sourceStock = await tx.tonKho.findUnique({
          where: {
            khoId_hangHoaId_viTriId: {
              khoId: transfer.khoNguonId,
              hangHoaId: item.hangHoaId,
              viTriId: item.viTriDiId,
            },
          },
        });

        if (!sourceStock || sourceStock.soLuongTon < item.slChuyen) {
          throw new Error(
            `Không đủ hàng "${item.hangHoa.tenHH}" tại vị trí nguồn ${item.viTriDi.maViTri} để điều chuyển (Tồn: ${sourceStock?.soLuongTon || 0}, Chuyển: ${item.slChuyen})`
          );
        }

        // Trừ tại nguồn
        await tx.tonKho.update({
          where: { id: sourceStock.id },
          data: {
            soLuongTon: sourceStock.soLuongTon - item.slChuyen,
            soLuongKhaDung: sourceStock.soLuongKhaDung - item.slChuyen,
          },
        });

        // 2. Kiểm tra sức chứa tại vị trí nhận đến (Kho đích)
        const destSlot = await tx.viTriLuuTru.findUnique({ where: { id: item.viTriDenId } });
        if (!destSlot) throw new Error('Không tìm thấy vị trí ô lưu trữ đích');

        const destSlotTotal = await tx.tonKho.aggregate({
          where: { viTriId: item.viTriDenId },
          _sum: { soLuongTon: true },
        });
        const currentDestQty = destSlotTotal._sum.soLuongTon || 0;
        if (currentDestQty + item.slChuyen > destSlot.sucChua) {
          throw new Error(
            `Vị trí đích "${destSlot.maViTri}" có hạn mức sức chứa là ${destSlot.sucChua} sản phẩm (hiện đang chứa ${currentDestQty}). Không thể chuyển thêm ${item.slChuyen} sản phẩm vì sẽ vượt quá hạn mức!`
          );
        }

        // 3. Cộng tồn kho tại vị trí nhận đến (Kho đích)
        const destStock = await tx.tonKho.findUnique({
          where: {
            khoId_hangHoaId_viTriId: {
              khoId: transfer.khoDichId,
              hangHoaId: item.hangHoaId,
              viTriId: item.viTriDenId,
            },
          },
        });

        if (destStock) {
          await tx.tonKho.update({
            where: { id: destStock.id },
            data: {
              soLuongTon: destStock.soLuongTon + item.slChuyen,
              soLuongKhaDung: destStock.soLuongKhaDung + item.slChuyen,
            },
          });
        } else {
          await tx.tonKho.create({
            data: {
              khoId: transfer.khoDichId,
              hangHoaId: item.hangHoaId,
              viTriId: item.viTriDenId,
              soLuongTon: item.slChuyen,
              soLuongKhaDung: item.slChuyen,
              soLuongTamGiu: 0,
            },
          });
        }
      }

      // 3. Cập nhật trạng thái phiếu chuyển sang APPROVED
      const approved = await tx.phieuChuyenKho.update({
        where: { id },
        data: {
          trangThai: TrangThaiPhieu.APPROVED,
          nguoiDuyetId: userId,
          ngayDuyet: new Date(),
        },
      });

      // 4. Ghi log
      await tx.lichSuThaoTac.create({
        data: {
          nguoiDungId: userId,
          loaiThaoTac: 'CHUYEN_KHO_DUYET',
          doiTuong: 'PhieuChuyenKho',
          doiTuongId: transfer.id,
          noiDung: `Phê duyệt phiếu chuyển kho ${transfer.maPC}, trừ tồn nguồn và cộng tồn đích thành công`,
          ipAddress: ipAddress || '127.0.0.1',
        },
      });

      return approved;
    });

    return result;
  }
}

