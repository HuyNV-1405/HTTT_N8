import prisma from '../config/prisma';
import { TrangThaiPhieu, TrangThaiViTri, LoaiCanhBao, TrangThaiCanhBao } from '@prisma/client';
import { generateDispatchCode } from '../utils/code-generator.util';

export interface CreateDispatchItemDto {
  hangHoaId: string;
  viTriId: string;
  slYeuCau: number;
  slThucXuat: number;
  donGiaXuat: number;
  ghiChu?: string;
}

export interface CreateDispatchDto {
  khoId: string;
  khachHangId: string;
  lyDoXuat: string;
  ghiChu?: string;
  items: CreateDispatchItemDto[];
}

export class DispatchService {
  static async getAllDispatches(query: { khoId?: string; trangThai?: TrangThaiPhieu }) {
    const where: any = {};
    if (query.khoId) where.khoId = query.khoId;
    if (query.trangThai) where.trangThai = query.trangThai;

    return prisma.phieuXuatKho.findMany({
      where,
      include: {
        kho: true,
        khachHang: true,
        nguoiLap: { select: { id: true, maNV: true, hoTen: true, username: true } },
        nguoiDuyet: { select: { id: true, maNV: true, hoTen: true, username: true } },
        chiTiet: {
          include: {
            hangHoa: true,
            viTri: true,
          },
        },
      },
      orderBy: { ngayTao: 'desc' },
    });
  }

  static async getDispatchById(id: string) {
    const dispatch = await prisma.phieuXuatKho.findUnique({
      where: { id },
      include: {
        kho: true,
        khachHang: true,
        nguoiLap: { select: { id: true, maNV: true, hoTen: true, username: true } },
        nguoiDuyet: { select: { id: true, maNV: true, hoTen: true, username: true } },
        chiTiet: {
          include: {
            hangHoa: true,
            viTri: true,
          },
        },
      },
    });

    if (!dispatch) {
      throw new Error('Không tìm thấy phiếu xuất kho');
    }
    return dispatch;
  }

  // 1. Kiểm tra tồn kho trước khi lập phiếu xuất
  static async checkInventoryAvailability(khoId: string, items: { hangHoaId: string; viTriId: string; soLuong: number }[]) {
    const results = [];
    let allAvailable = true;

    for (const item of items) {
      const stock = await prisma.tonKho.findUnique({
        where: {
          khoId_hangHoaId_viTriId: {
            khoId,
            hangHoaId: item.hangHoaId,
            viTriId: item.viTriId,
          },
        },
        include: {
          hangHoa: true,
          viTri: true,
        },
      });

      const soLuongTon = stock ? stock.soLuongTon : 0;
      const soLuongKhaDung = stock ? stock.soLuongKhaDung : 0;
      const isDuHang = soLuongKhaDung >= item.soLuong;

      if (!isDuHang) {
        allAvailable = false;
      }

      results.push({
        hangHoaId: item.hangHoaId,
        tenHH: stock?.hangHoa.tenHH || 'Sản phẩm chưa có tồn',
        viTriId: item.viTriId,
        maViTri: stock?.viTri.maViTri || 'Vị trí chưa có hàng',
        soLuongYeuCau: item.soLuong,
        soLuongTonHienTai: soLuongTon,
        soLuongKhaDung,
        isDuHang,
      });
    }

    return { allAvailable, results };
  }

  // 2. Tạo phiếu xuất kho (Mặc định ở trạng thái PENDING)
  static async createDispatch(data: CreateDispatchDto, userId: string) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Phiếu xuất kho phải có ít nhất 1 mặt hàng chi tiết');
    }

    // Kiểm tra khả năng đáp ứng tồn kho
    const availability = await this.checkInventoryAvailability(
      data.khoId,
      data.items.map((i) => ({ hangHoaId: i.hangHoaId, viTriId: i.viTriId, soLuong: i.slThucXuat }))
    );

    if (!availability.allAvailable) {
      const thieuHang = availability.results
        .filter((r) => !r.isDuHang)
        .map((r) => `"${r.tenHH}" tại vị trí ${r.maViTri} (Cần: ${r.soLuongYeuCau}, Tồn khả dụng: ${r.soLuongKhaDung})`)
        .join('; ');
      throw new Error(`Không đủ hàng tồn kho để xuất: ${thieuHang}`);
    }

    const maPX = await generateDispatchCode();

    let tongTien = 0;
    const itemsData = data.items.map((item) => {
      const thanhTien = item.slThucXuat * item.donGiaXuat;
      tongTien += thanhTien;
      return {
        hangHoaId: item.hangHoaId,
        viTriId: item.viTriId,
        slYeuCau: item.slYeuCau,
        slThucXuat: item.slThucXuat,
        donGiaXuat: item.donGiaXuat,
        thanhTien,
        ghiChu: item.ghiChu,
      };
    });

    // Tạo phiếu xuất và tạm giữ số lượng khả dụng
    const dispatch = await prisma.$transaction(async (tx) => {
      const created = await tx.phieuXuatKho.create({
        data: {
          maPX,
          khoId: data.khoId,
          khachHangId: data.khachHangId,
          nguoiLapId: userId,
          trangThai: TrangThaiPhieu.PENDING,
          lyDoXuat: data.lyDoXuat,
          tongTien,
          ghiChu: data.ghiChu,
          chiTiet: {
            create: itemsData,
          },
        },
        include: {
          chiTiet: true,
        },
      });

      // Tăng số lượng tạm giữ (soLuongTamGiu) và giảm tồn khả dụng (soLuongKhaDung)
      for (const item of data.items) {
        await tx.tonKho.update({
          where: {
            khoId_hangHoaId_viTriId: {
              khoId: data.khoId,
              hangHoaId: item.hangHoaId,
              viTriId: item.viTriId,
            },
          },
          data: {
            soLuongTamGiu: { increment: item.slThucXuat },
            soLuongKhaDung: { decrement: item.slThucXuat },
          },
        });
      }

      await tx.lichSuThaoTac.create({
        data: {
          nguoiDungId: userId,
          loaiThaoTac: 'TAO_PHIEU_XUAT',
          doiTuong: 'PhieuXuatKho',
          doiTuongId: created.id,
          noiDung: `Lập yêu cầu xuất kho ${maPX} với ${data.items.length} mặt hàng, tạm giữ tồn kho thành công`,
        },
      });

      return created;
    });

    return dispatch;
  }

  // 3. PHÊ DUYỆT PHIẾU XUẤT (BẮT BUỘC DÙNG DATABASE TRANSACTION)
  // Logic: Kiểm tra tồn -> Chuyển trạng thái sang APPROVED -> Tự động Ghi sổ xuất kho (TRỪ TỒN KHO)
  static async approveDispatch(id: string, userId: string, ipAddress?: string) {
    const dispatch = await prisma.phieuXuatKho.findUnique({
      where: { id },
      include: {
        chiTiet: {
          include: {
            hangHoa: true,
            viTri: true,
          },
        },
      },
    });

    if (!dispatch) {
      throw new Error('Không tìm thấy phiếu xuất kho');
    }

    if (dispatch.trangThai !== TrangThaiPhieu.PENDING) {
      throw new Error(`Phiếu xuất ${dispatch.maPX} không ở trạng thái Chờ duyệt (Trạng thái hiện tại: ${dispatch.trangThai})`);
    }

    // BẮT ĐẦU TRANSACTION TRỪ TỒN KHO
    const result = await prisma.$transaction(async (tx) => {
      // a. Duyệt từng chi tiết hàng và trừ tồn kho
      for (const item of dispatch.chiTiet) {
        const stock = await tx.tonKho.findUnique({
          where: {
            khoId_hangHoaId_viTriId: {
              khoId: dispatch.khoId,
              hangHoaId: item.hangHoaId,
              viTriId: item.viTriId,
            },
          },
        });

        if (!stock || stock.soLuongTon < item.slThucXuat) {
          throw new Error(
            `Không đủ số lượng hàng "${item.hangHoa.tenHH}" tại vị trí ${item.viTri.maViTri} để hoàn tất xuất kho (Tồn: ${stock?.soLuongTon || 0}, Cần xuất: ${item.slThucXuat})`
          );
        }

        // Trừ tồn kho thực tế và giải phóng số lượng tạm giữ
        const updatedStock = await tx.tonKho.update({
          where: { id: stock.id },
          data: {
            soLuongTon: stock.soLuongTon - item.slThucXuat,
            soLuongTamGiu: Math.max(0, stock.soLuongTamGiu - item.slThucXuat),
          },
        });

        // b. Cập nhật lại trạng thái ô lưu trữ (ViTriLuuTru)
        const totalItemsInSlot = await tx.tonKho.aggregate({
          where: { viTriId: item.viTriId },
          _sum: { soLuongTon: true },
        });
        const currentSlotTotal = totalItemsInSlot._sum.soLuongTon || 0;

        await tx.viTriLuuTru.update({
          where: { id: item.viTriId },
          data: {
            trangThai: currentSlotTotal === 0 ? TrangThaiViTri.EMPTY : TrangThaiViTri.PARTIAL,
          },
        });

        // c. KIỂM TRA ĐỊNH MỨC TỒN KHO & TỰ ĐỘNG SINH CẢNH BÁO
        const totalWarehouseStock = await tx.tonKho.aggregate({
          where: { khoId: dispatch.khoId, hangHoaId: item.hangHoaId },
          _sum: { soLuongTon: true },
        });
        const currentTotal = totalWarehouseStock._sum.soLuongTon || 0;

        if (currentTotal === 0) {
          // Cảnh báo hết hàng
          await tx.canhBaoTonKho.create({
            data: {
              khoId: dispatch.khoId,
              hangHoaId: item.hangHoaId,
              loaiCanhBao: LoaiCanhBao.HET_HANG,
              mucTonHienTai: 0,
              mucTonToiThieu: item.hangHoa.dinhMucToiThieu,
              mucTonToiDa: item.hangHoa.dinhMucToiDa,
              noiDung: `Hàng hóa "${item.hangHoa.tenHH}" đã HẾT HÀNG (Tồn = 0) sau khi xuất phiếu ${dispatch.maPX}`,
            },
          });
        } else if (currentTotal < item.hangHoa.dinhMucToiThieu) {
          // Cảnh báo dưới định mức tối thiểu
          await tx.canhBaoTonKho.create({
            data: {
              khoId: dispatch.khoId,
              hangHoaId: item.hangHoaId,
              loaiCanhBao: LoaiCanhBao.DUOI_MUC_TOI_THIEU,
              mucTonHienTai: currentTotal,
              mucTonToiThieu: item.hangHoa.dinhMucToiThieu,
              mucTonToiDa: item.hangHoa.dinhMucToiDa,
              noiDung: `Hàng hóa "${item.hangHoa.tenHH}" chỉ còn ${currentTotal} ${item.hangHoa.donViTinh}, dưới mức tồn tối thiểu (${item.hangHoa.dinhMucToiThieu}). Cần nhập thêm hàng!`,
            },
          });
        }
      }

      // d. Đổi trạng thái phiếu xuất sang APPROVED
      const approvedDispatch = await tx.phieuXuatKho.update({
        where: { id },
        data: {
          trangThai: TrangThaiPhieu.APPROVED,
          nguoiDuyetId: userId,
          ngayDuyet: new Date(),
        },
      });

      // e. Ghi nhật ký hệ thống
      await tx.lichSuThaoTac.create({
        data: {
          nguoiDungId: userId,
          loaiThaoTac: 'XUAT_KHO_DUYET',
          doiTuong: 'PhieuXuatKho',
          doiTuongId: dispatch.id,
          noiDung: `Phê duyệt phiếu xuất kho ${dispatch.maPX}, đã trừ tồn kho thành công cho khách hàng`,
          ipAddress: ipAddress || '127.0.0.1',
        },
      });

      return approvedDispatch;
    });

    return result;
  }

  // 4. Từ chối hoặc hủy phiếu xuất (Giải phóng tạm giữ)
  static async rejectDispatch(id: string, userId: string, lyDo?: string) {
    const dispatch = await prisma.phieuXuatKho.findUnique({
      where: { id },
      include: { chiTiet: true },
    });

    if (!dispatch) throw new Error('Không tìm thấy phiếu xuất kho');
    if (dispatch.trangThai !== TrangThaiPhieu.PENDING) {
      throw new Error('Chỉ có thể từ chối phiếu đang ở trạng thái Chờ duyệt');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Giải phóng số lượng tạm giữ trả về tồn khả dụng
      for (const item of dispatch.chiTiet) {
        await tx.tonKho.update({
          where: {
            khoId_hangHoaId_viTriId: {
              khoId: dispatch.khoId,
              hangHoaId: item.hangHoaId,
              viTriId: item.viTriId,
            },
          },
          data: {
            soLuongTamGiu: { decrement: item.slThucXuat },
            soLuongKhaDung: { increment: item.slThucXuat },
          },
        });
      }

      const updated = await tx.phieuXuatKho.update({
        where: { id },
        data: {
          trangThai: TrangThaiPhieu.REJECTED,
          nguoiDuyetId: userId,
          ngayDuyet: new Date(),
          ghiChu: lyDo ? `${dispatch.ghiChu || ''} [Lý do từ chối: ${lyDo}]` : dispatch.ghiChu,
        },
      });

      await tx.lichSuThaoTac.create({
        data: {
          nguoiDungId: userId,
          loaiThaoTac: 'TU_CHOI_XUAT_KHO',
          doiTuong: 'PhieuXuatKho',
          doiTuongId: id,
          noiDung: `Từ chối phiếu xuất kho ${dispatch.maPX}, đã giải phóng tồn khả dụng`,
        },
      });

      return updated;
    });

    return result;
  }
}

