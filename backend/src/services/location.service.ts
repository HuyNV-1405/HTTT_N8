import prisma from '../config/prisma';
import { TrangThaiViTri } from '@prisma/client';

export class LocationService {
  static async getAllWarehouses() {
    return prisma.kho.findMany({
      where: { trangThai: true },
      include: {
        nguoiQuanLy: { select: { id: true, maNV: true, hoTen: true } },
        khuVuc: {
          include: {
            _count: { select: { viTriLuuTru: true } },
          },
        },
        _count: {
          select: {
            viTriLuuTru: true,
            tonKho: true,
          },
        },
      },
      orderBy: { maKho: 'asc' },
    });
  }

  static async getLocations(query: { khoId?: string; khuVucId?: string; trangThai?: TrangThaiViTri }) {
    const where: any = {};
    if (query.khoId) where.khoId = query.khoId;
    if (query.khuVucId) where.khuVucId = query.khuVucId;
    if (query.trangThai) where.trangThai = query.trangThai;

    const locations = await prisma.viTriLuuTru.findMany({
      where,
      include: {
        kho: true,
        khuVuc: true,
        tonKho: {
          include: {
            hangHoa: true,
          },
        },
      },
      orderBy: [{ kho: { maKho: 'asc' } }, { khuVuc: { maKhuVuc: 'asc' } }, { ke: 'asc' }, { tang: 'asc' }, { o: 'asc' }],
    });

    // Tính toán số lượng hàng thực tế đang chứa và tỷ lệ lấp đầy
    return locations.map((loc) => {
      const currentStoredQty = loc.tonKho.reduce((sum, item) => sum + item.soLuongTon, 0);
      const occupancyRate = loc.sucChua > 0 ? Math.min(100, Math.round((currentStoredQty / loc.sucChua) * 100)) : 0;

      return {
        ...loc,
        currentStoredQty,
        occupancyRate,
      };
    });
  }

  static async createLocation(data: {
    khoId: string;
    khuVucId: string;
    ke: string;
    tang: string;
    o: string;
    sucChua?: number;
    moTa?: string;
  }) {
    const kho = await prisma.kho.findUnique({ where: { id: data.khoId } });
    const khuVuc = await prisma.khuVuc.findUnique({ where: { id: data.khuVucId } });
    if (!kho || !khuVuc) throw new Error('Kho hoặc Khu vực không hợp lệ');

    const maViTri = `${kho.maKho}-${khuVuc.maKhuVuc}-${data.ke}-${data.tang}-${data.o}`;

    const existing = await prisma.viTriLuuTru.findUnique({ where: { maViTri } });
    if (existing) throw new Error(`Mã vị trí ${maViTri} đã tồn tại`);

    return prisma.viTriLuuTru.create({
      data: {
        maViTri,
        khoId: data.khoId,
        khuVucId: data.khuVucId,
        ke: data.ke,
        tang: data.tang,
        o: data.o,
        sucChua: data.sucChua || 100,
        trangThai: TrangThaiViTri.EMPTY,
        moTa: data.moTa,
      },
      include: {
        kho: true,
        khuVuc: true,
      },
    });
  }

  static async updateLocationStatus(id: string, trangThai: TrangThaiViTri) {
    return prisma.viTriLuuTru.update({
      where: { id },
      data: { trangThai },
    });
  }
}

