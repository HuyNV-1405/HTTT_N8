import prisma from '../config/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_wms_team8_2026';

export class AuthService {
  static async login(username: string, pass: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.trangThai !== UserStatus.ACTIVE) {
      throw new Error('Tài khoản này hiện đang bị khóa hoặc ngừng kích hoạt');
    }

    const isMatch = bcrypt.compareSync(pass, user.password);
    if (!isMatch) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    // Tạo JWT Token
    const tokenPayload = {
      id: user.id,
      maNV: user.maNV,
      username: user.username,
      hoTen: user.hoTen,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Ghi log đăng nhập
    await prisma.lichSuThaoTac.create({
      data: {
        nguoiDungId: user.id,
        loaiThaoTac: 'LOGIN',
        doiTuong: 'USER',
        doiTuongId: user.id,
        noiDung: `Người dùng ${user.hoTen} (${user.username}) đăng nhập hệ thống thành công`,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });

    return {
      token,
      user: {
        id: user.id,
        maNV: user.maNV,
        username: user.username,
        hoTen: user.hoTen,
        email: user.email,
        sdt: user.sdt,
        role: user.role,
      },
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        maNV: true,
        username: true,
        hoTen: true,
        email: true,
        sdt: true,
        role: true,
        trangThai: true,
        ngayTao: true,
      },
    });

    if (!user) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }

    return user;
  }

  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        maNV: true,
        username: true,
        hoTen: true,
        email: true,
        sdt: true,
        role: true,
        trangThai: true,
        ngayTao: true,
      },
      orderBy: { ngayTao: 'asc' },
    });
  }
}

