import React, { useState, useEffect } from 'react';
import { Kho, Product, ViTriLuuTru } from '../types';
import { ArrowLeftRight, Plus, CheckCircle2, Clock, FileText, ShieldCheck, MapPin, ArrowRight, X } from 'lucide-react';

interface TransfersViewProps {
  transfers: any[];
  warehouses: Kho[];
  products: Product[];
  locations: ViTriLuuTru[];
  onCreateTransfer: (data: any) => Promise<void>;
  onApproveTransfer: (id: string) => Promise<void>;
  canApprove: boolean;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  transfers,
  warehouses,
  products,
  locations,
  onCreateTransfer,
  onApproveTransfer,
  canApprove,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Vì hệ thống quản lý 1 kho, khoId là kho duy nhất của hệ thống
  const currentKho = warehouses[0];
  const [hangHoaId, setHangHoaId] = useState(products[0]?.id || '');
  const [viTriDiId, setViTriDiId] = useState('');
  const [viTriDenId, setViTriDenId] = useState('');
  const [slChuyen, setSlChuyen] = useState(5);
  const [ghiChu, setGhiChu] = useState('Sắp xếp lại vị trí lưu trữ trong kho');

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenModal = () => {
    setShowCreateModal(true);
    if (locations.length >= 2) {
      setViTriDiId(locations[0].id);
      setViTriDenId(locations[1].id);
    } else if (locations.length === 1) {
      setViTriDiId(locations[0].id);
      setViTriDenId(locations[0].id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viTriDiId || !viTriDenId) {
      alert('Vui lòng chọn đầy đủ Vị trí đi và Vị trí đến');
      return;
    }
    if (viTriDiId === viTriDenId) {
      alert('Vị trí đi và Vị trí đến phải khác nhau!');
      return;
    }
    if (slChuyen <= 0) {
      alert('Số lượng chuyển phải lớn hơn 0');
      return;
    }

    // Kiểm tra ràng buộc sức chứa vị trí đích
    const destLoc = locations.find((l) => l.id === viTriDenId);
    if (destLoc) {
      const remaining = Math.max(0, destLoc.sucChua - (destLoc.currentStoredQty || 0));
      if (slChuyen > remaining) {
        alert(`Không thể chuyển: Vị trí đích "${destLoc.maViTri}" chỉ còn trống ${remaining}/${destLoc.sucChua} sản phẩm. Số lượng chuyển (${slChuyen}) vượt quá hạn mức chứa!`);
        return;
      }
    }

    try {
      await onCreateTransfer({
        khoNguonId: currentKho?.id || '',
        khoDichId: currentKho?.id || '',
        ghiChu,
        items: [
          {
            hangHoaId,
            viTriDiId,
            viTriDenId,
            slChuyen,
            ghiChu,
          },
        ],
      });
      setShowCreateModal(false);
      setGhiChu('Sắp xếp lại vị trí lưu trữ trong kho');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi tạo phiếu chuyển vị trí');
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Xác nhận PHÊ DUYỆT điều chuyển vị trí? Hệ thống sẽ kích hoạt Database Transaction để: Trừ tồn kho tại Vị trí đi và Cộng tồn kho tại Vị trí đến.')) {
      return;
    }
    setLoadingId(id);
    // Kiểm tra ràng buộc sức chứa vị trí đích
    const destLoc = locations.find((l) => l.id === viTriDenId);
    if (destLoc) {
      const remaining = Math.max(0, destLoc.sucChua - (destLoc.currentStoredQty || 0));
      if (slChuyen > remaining) {
        alert(`Không thể chuyển: Vị trí đích "${destLoc.maViTri}" chỉ còn trống ${remaining}/${destLoc.sucChua} sản phẩm. Số lượng chuyển (${slChuyen}) vượt quá hạn mức chứa!`);
        return;
      }
    }

    try {
      await onApproveTransfer(id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi duyệt phiếu chuyển');
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
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Phiếu Chuyển Vị Trí Hàng Hóa</h2>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lập Phiếu Chuyển Vị Trí</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã Phiếu</th>
                <th className="p-3.5">Mặt Hàng Chuyển</th>
                <th className="p-3.5 text-center">Vị Trí Đi (Ô Nguồn)</th>
                <th className="p-3.5 text-center">Vị Trí Đến (Ô Đích)</th>
                <th className="p-3.5 text-center">SL Chuyển</th>
                <th className="p-3.5">Người Lập</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Chưa có phiếu chuyển vị trí nào được tạo
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const firstItem = t.chiTiet?.[0];
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        <span>{t.maPC}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {firstItem?.hangHoa?.tenHH || 'Nhiều mặt hàng'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                          {firstItem?.viTriDi?.maViTri || '---'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                          {firstItem?.viTriDen?.maViTri || '---'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 text-sm">
                        {firstItem?.slChuyen || 0}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{t.nguoiLap?.hoTen}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(t.ngayLap).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        {t.trangThai === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Đã hoàn tất chuyển
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                            <Clock className="w-3 h-3" /> Chờ phê duyệt
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {t.trangThai === 'PENDING' && canApprove ? (
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={loadingId === t.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors flex items-center gap-1 mx-auto shadow-sm cursor-pointer"
                            title="Chạy Transaction chuyển tồn kho giữa 2 vị trí"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{loadingId === t.id ? 'Đang duyệt...' : 'Duyệt Chuyển'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">Đã ghi sổ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                  <span>Lập Phiếu Chuyển Vị Trí Hàng Hóa</span>
                </h3>
                <p className="text-[11px] text-red-100 mt-0.5">Kho thực hiện: {currentKho?.tenKho}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                title="Đóng cửa sổ (Phím Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chọn Hàng Hóa Cần Chuyển *</label>
                  <select
                    value={hangHoaId}
                    onChange={(e) => setHangHoaId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-red-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.maHH} - {p.tenHH} (Tồn: {p.tongTon} {p.donViTinh})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source and Destination Positions with visual flow arrow */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span>Điều Phối Vị Trí Trong Kho</span>
                    <ArrowRight className="w-4 h-4 text-red-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-rose-700 mb-1">Vị Trí Đi (Lấy Hàng Ra) *</label>
                      <select
                        value={viTriDiId}
                        onChange={(e) => setViTriDiId(e.target.value)}
                        className="w-full p-2 border border-rose-300 bg-rose-50/50 rounded-lg font-mono font-medium text-slate-800 focus:ring-2 focus:ring-red-500"
                      >
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.maViTri} (Sức chứa: {l.currentStoredQty || 0}/{l.sucChua})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-emerald-700 mb-1">Vị Trí Đến (Cất Hàng Vào) *</label>
                      <select
                        value={viTriDenId}
                        onChange={(e) => setViTriDenId(e.target.value)}
                        className="w-full p-2 border border-emerald-300 bg-emerald-50/50 rounded-lg font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.maViTri} (Sức chứa: {l.currentStoredQty || 0}/{l.sucChua})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số Lượng Chuyển *</label>
                    <input
                      type="number"
                      min={1}
                      value={slChuyen}
                      onChange={(e) => setSlChuyen(parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-center text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lý Do / Ghi Chú</label>
                    <input
                      type="text"
                      value={ghiChu}
                      onChange={(e) => setGhiChu(e.target.value)}
                      placeholder="VD: Sắp xếp lại kệ, tối ưu không gian..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy (Esc)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Tạo Phiếu Chuyển Vị Trí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
