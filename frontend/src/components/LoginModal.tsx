import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, KeyRound, Sparkles, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, pass: string) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const demoAccounts = [
    { label: 'Admin Hệ Thống', user: 'admin', pass: 'Admin@123', role: 'Toàn quyền cấu hình & duyệt' },
    { label: 'Quản Lý Kho', user: 'quanlykho', pass: 'Quanly@123', role: 'Phê duyệt nhập / xuất / chuyển' },
    { label: 'Nhân Viên Kho', user: 'nhanvienkho', pass: 'Nhanvien@123', role: 'Thực hiện kiểm đếm, cất hàng' },
    { label: 'Nhân Viên Mua Hàng', user: 'muahang', pass: 'Muahang@123', role: 'Tạo phiếu nhập từ NCC' },
    { label: 'Nhân Viên Kinh Doanh', user: 'banhang', pass: 'Banhang@123', role: 'Tạo phiếu xuất cho khách' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await onLogin(username, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-r from-red-600 to-rose-700 text-white text-center relative shrink-0 shadow-sm">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold">Đăng Nhập Hệ Thống Quản Lý Kho</h3>
          <p className="text-xs text-red-100 mt-1">Xác thực tài khoản và kiểm thử phân quyền nghiệp vụ</p>
          <button
            type="button"
            onClick={onClose}
            title="Đóng cửa sổ (Phím Esc)"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên Đăng Nhập</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật Khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
          </button>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tài khoản mẫu từ Seeding (Nhấp để chọn nhanh):</span>
            </div>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  type="button"
                  key={acc.user}
                  onClick={() => handleSelectDemo(acc.user, acc.pass)}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between text-[11px] cursor-pointer ${
                    username === acc.user
                      ? 'bg-red-50 border-red-300 text-red-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="font-bold">{acc.label}</span>
                    <span className="text-slate-400 ml-1.5">(@{acc.user})</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

