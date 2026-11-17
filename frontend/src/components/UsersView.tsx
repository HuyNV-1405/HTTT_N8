import React, { useState } from 'react';
import { User, Role } from '../types';
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  Lock,
  Unlock,
  Mail,
  Phone,
  Search,
  CheckCircle,
  XCircle,
  X,
  UserPlus
} from 'lucide-react';

interface UsersViewProps {
  users: User[];
  currentUserId?: string;
  onCreateUser: (data: any) => Promise<void>;
  onToggleStatus: (userId: string) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUserId,
  onCreateUser,
  onToggleStatus,
}) => {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Form thêm nhân viên
  const [formData, setFormData] = useState({
    maNV: '',
    hoTen: '',
    username: '',
    password: '',
    email: '',
    sdt: '',
    role: 'NHAN_VIEN_KHO' as Role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.hoTen.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.maNV.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
            <Shield className="w-3 h-3 text-red-600" />
            Admin Quản trị
          </span>
        );
      case 'QUAN_LY_KHO':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
            <UserCheck className="w-3 h-3 text-rose-600" />
            Quản lý kho
          </span>
        );
      case 'NHAN_VIEN_KHO':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
            Nhân viên kho
          </span>
        );
      case 'NHAN_VIEN_MUA_HANG':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
            NV Mua hàng
          </span>
        );
      case 'NHAN_VIEN_BAN_HANG':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
            NV Kinh doanh
          </span>
        );
      default:
        return null;
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maNV || !formData.hoTen || !formData.username || !formData.password) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateUser(formData);
      setShowAddModal(false);
      setFormData({
        maNV: '',
        hoTen: '',
        username: '',
        password: '',
        email: '',
        sdt: '',
        role: 'NHAN_VIEN_KHO',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi tạo nhân viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (user: User) => {
    if (user.id === currentUserId) {
      alert('Bạn không thể tự khóa tài khoản của chính mình!');
      return;
    }
    const actionName = user.trangThai === 'ACTIVE' ? 'KHÓA' : 'MỞ KHÓA';
    if (!confirm(`Xác nhận ${actionName} tài khoản "${user.hoTen} (@${user.username})"?`)) {
      return;
    }
    setLoadingId(user.id);
    try {
      await onToggleStatus(user.id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-lg">Quản Lý Nhân Viên & Phân Quyền</h2>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
                Chỉ dành cho Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấp tài khoản, phân bổ quyền hạn và quản trị trạng thái hoạt động của nhân sự
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, mã NV, username hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ADMIN', label: 'Admin' },
            { id: 'QUAN_LY_KHO', label: 'Quản lý kho' },
            { id: 'NHAN_VIEN_KHO', label: 'Nhân viên kho' },
            { id: 'NHAN_VIEN_MUA_HANG', label: 'Mua hàng' },
            { id: 'NHAN_VIEN_BAN_HANG', label: 'Kinh doanh' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFilterRole(r.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterRole === r.id
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã NV</th>
                <th className="p-3.5">Họ Và Tên</th>
                <th className="p-3.5">Tên Đăng Nhập</th>
                <th className="p-3.5">Vai Trò Phân Quyền</th>
                <th className="p-3.5">Liên Hệ</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không tìm thấy nhân viên nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUserId;
                  const isActive = user.trangThai === 'ACTIVE';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-800">
                        {user.maNV}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs shrink-0 border border-red-200">
                            {user.hoTen.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{user.hoTen}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Ngày tạo: {user.ngayTao ? new Date(user.ngayTao).toLocaleDateString('vi-VN') : '---'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-medium">
                        @{user.username}
                      </td>
                      <td className="p-3.5">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="space-y-0.5">
                          {user.email && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.sdt && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.sdt}</span>
                            </div>
                          )}
                          {!user.email && !user.sdt && (
                            <span className="text-slate-400 italic">Chưa cập nhật</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          disabled={isCurrent || loadingId === user.id}
                          onClick={() => handleToggle(user)}
                          title={isCurrent ? 'Không thể tự khóa tài khoản' : isActive ? 'Bấm để khóa tài khoản' : 'Bấm để mở khóa tài khoản'}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isCurrent
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                              : isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Nhân Viên Mới */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white text-base">Thêm Nhân Viên & Phân Quyền Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                title="Đóng (Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-3.5 text-xs overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã Nhân Viên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NV02, QL02..."
                      value={formData.maNV}
                      onChange={(e) => setFormData({ ...formData, maNV: e.target.value.toUpperCase() })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Họ Và Tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn A"
                      value={formData.hoTen}
                      onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên Đăng Nhập (Username) *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: van_a..."
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mật Khẩu Khởi Tạo *</label>
                    <input
                      type="password"
                      required
                      placeholder="Mật khẩu đăng nhập..."
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai Trò Phân Quyền Trong Hệ Thống *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-medium text-slate-800"
                  >
                    <option value="NHAN_VIEN_KHO">Nhân Viên Kho (Thực hiện kiểm đếm, xếp hàng, lấy hàng tác nghiệp)</option>
                    <option value="QUAN_LY_KHO">Quản Lý Kho (Phê duyệt phiếu nhập/xuất/chuyển, xử lý cảnh báo)</option>
                    <option value="NHAN_VIEN_MUA_HANG">Nhân Viên Mua Hàng (Tạo phiếu nhập từ NCC, quản lý mặt hàng)</option>
                    <option value="NHAN_VIEN_BAN_HANG">Nhân Viên Kinh Doanh (Tạo yêu cầu xuất kho cho khách hàng)</option>
                    <option value="ADMIN">Admin Quản Trị Hệ Thống (Toàn quyền quản trị, nhân sự & kiểm toán)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="VD: van_a@wms.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                    <input
                      type="tel"
                      placeholder="VD: 0912345678"
                      value={formData.sdt}
                      onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy (Esc)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Lưu Nhân Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
