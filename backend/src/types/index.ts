import { Role, TrangThaiPhieu, TrangThaiViTri, LoaiCanhBao } from '@prisma/client';

export interface AuthUser {
  id: string;
  maNV: string;
  username: string;
  hoTen: string;
  role: Role;
}

export interface InventoryCheckResult {
  hangHoaId: string;
  viTriId: string;
  soLuongYeuCau: number;
  soLuongTonHienTai: number;
  soLuongKhaDung: number;
  isDuHang: boolean;
}

