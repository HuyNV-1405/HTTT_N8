import React from 'react';
import { User } from '../types';
import { UserCheck, LogOut, Bell, Building2 } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  alertCount: number;
  onAlertClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenLogin,
  onLogout,
  alertCount,
  onAlertClick,
}) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Admin Quản trị</span>;
      case 'QUAN_LY_KHO':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Quản lý kho</span>;
      case 'NHAN_VIEN_KHO':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Nhân viên kho</span>;
      case 'NHAN_VIEN_MUA_HANG':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">NV Mua hàng</span>;
      case 'NHAN_VIEN_BAN_HANG':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">NV Kinh doanh</span>;
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Kho active info */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Building2 className="w-4 h-4 text-red-600" />
        <span className="font-bold text-slate-800">Kho Tổng Trung Tâm</span>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
          Hệ thống 1 Kho Tập Trung
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notification button */}
        <button
          onClick={onAlertClick}
          className="relative p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="Xem cảnh báo tồn kho"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* User Account / Role switcher */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800 flex items-center justify-end gap-2">
                {user.hoTen}
                {getRoleBadge(user.role)}
              </div>
              <div className="text-xs text-slate-500">Mã NV: {user.maNV} (@{user.username})</div>
            </div>
            <button
              onClick={onOpenLogin}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium border border-slate-300 transition-colors cursor-pointer"
              title="Đổi vai trò để test phân quyền"
            >
              Đổi vai trò
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Đăng nhập hệ thống</span>
          </button>
        )}
      </div>
    </header>
  );
};

