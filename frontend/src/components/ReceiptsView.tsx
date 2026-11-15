import React, { useState, useEffect } from 'react';
import { Receipt, Product, Kho, NhaCungCap, ViTriLuuTru } from '../types';
import {
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Warehouse,
  Trash2,
  ShieldCheck,
  X
} from 'lucide-react';

interface ReceiptsViewProps {
  receipts: Receipt[];
  products: Product[];
  warehouses: Kho[];
  suppliers: NhaCungCap[];
  locations: ViTriLuuTru[];
  onCreateReceipt: (data: any) => Promise<void>;
  onApproveReceipt: (id: string) => Promise<void>;
  onRejectReceipt: (id: string, lyDo?: string) => Promise<void>;
  canApprove: boolean;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts,
  products,
  warehouses,
  suppliers,
  locations,
  onCreateReceipt,
  onApproveReceipt,
  onRejectReceipt,
  canApprove,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReceipt(null);
        setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form state
  const [khoId, setKhoId] = useState(warehouses[0]?.id || '');
  const [nhaCungCapId, setNhaCungCapId] = useState(suppliers[0]?.id || '');
  const [ketQuaKiemTra, setKetQuaKiemTra] = useState('Đã kiểm tra tem mác và quy cách đóng gói đạt chuẩn');
  const [ghiChu, setGhiChu] = useState('');
  const [items, setItems] = useState<
    { hangHoaId: string; viTriId: string; slYeuCau: number; slThucNhap: number; donGiaNhap: number }[]
  >([]);

  const filteredReceipts = receipts.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.trangThai === filterStatus;
  });

  const availableLocations = locations.filter((l) => !khoId || l.khoId === khoId);

  const addItemRow = () => {
    if (products.length === 0 || availableLocations.length === 0) return;
    const defaultProduct = products[0];
    const defaultLoc = availableLocations[0];
    setItems([
      ...items,
      {
        hangHoaId: defaultProduct.id,
        viTriId: defaultLoc.id,
        slYeuCau: 10,
        slThucNhap: 10,
        donGiaNhap: Number(defaultProduct.giaNhap) || 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'hangHoaId') {
      const p = products.find((prod) => prod.id === value);
      if (p) updated[index].donGiaNhap = Number(p.giaNhap);
    }
    setItems(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập');
      return;
    }

    // Kiểm tra ràng buộc hạn mức sức chứa ô
    for (const item of items) {
      const loc = locations.find((l) => l.id === item.viTriId);
      if (loc) {
        const remaining = Math.max(0, loc.sucChua - (loc.currentStoredQty || 0));
        if (item.slThucNhap > remaining) {
          alert(`Không thể lập phiếu: Vị trí ô "${loc.maViTri}" chỉ còn trống ${remaining}/${loc.sucChua} sản phẩm. Số lượng nhập (${item.slThucNhap}) vượt quá hạn mức chứa!`);
          return;
        }
      }
    }
    try {
      await onCreateReceipt({
        khoId,
        nhaCungCapId,
        ketQuaKiemTra,
        ghiChu,
        items,
      });
      setShowCreateModal(false);
      setItems([]);
      setGhiChu('');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi tạo phiếu nhập');
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Xác nhận PHÊ DUYỆT phiếu nhập kho này? Hệ thống sẽ chạy Database Transaction để cộng tồn kho và cập nhật trạng thái ô lưu trữ.')) {
      return;
    }
    setLoadingId(id);
    try {
      await onApproveReceipt(id);
      if (selectedReceipt?.id === id) {
        setSelectedReceipt(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi duyệt phiếu');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const lyDo = prompt('Nhập lý do từ chối phiếu nhập kho:');
    if (lyDo === null) return;
    setLoadingId(id);
    try {
      await onRejectReceipt(id, lyDo);
      if (selectedReceipt?.id === id) {
        setSelectedReceipt(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi từ chối phiếu');
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
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Quản Lý Nhập Kho</h2>
          </div>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            if (items.length === 0) addItemRow();
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lập Phiếu Nhập Mới</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs font-semibold">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterStatus === st
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            {st === 'ALL' && 'Tất cả'}
            {st === 'PENDING' && 'Chờ Duyệt (Pending)'}
            {st === 'APPROVED' && 'Đã Ghi Sổ (Approved)'}
            {st === 'REJECTED' && 'Bị Từ Chối (Rejected)'}
          </button>
        ))}
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã Phiếu</th>
                <th className="p-3.5">Tên Sản Phẩm</th>
                <th className="p-3.5">Nhà Cung Cấp</th>
                <th className="p-3.5">Người Lập</th>
                <th className="p-3.5">Số Mặt Hàng</th>
                <th className="p-3.5 text-right">Tổng Tiền</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không có phiếu nhập nào ở trạng thái này
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" />
                      <span>{r.maPN}</span>
                    </td>
                    <td className="p-3.5">
                      {r.chiTiet && r.chiTiet.length > 0 ? (
                        <div>
                          <div className="font-semibold text-slate-800 line-clamp-1 max-w-[240px]">
                            {r.chiTiet[0].hangHoa?.tenHH || 'Chưa xác định'}
                          </div>
                          {r.chiTiet.length > 1 ? (
                            <div className="text-[10px] text-red-600 font-medium">
                              +{r.chiTiet.length - 1} mặt hàng khác
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {r.chiTiet[0].hangHoa?.maHH}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Chưa có chi tiết</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">{r.nhaCungCap?.tenNCC}</td>
                    <td className="p-3.5 text-slate-600">
                      <div>{r.nguoiLap?.hoTen}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.ngayNhap).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {r.chiTiet?.length || 0} mục
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {Number(r.tongTien).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3.5 text-center">
                      {r.trangThai === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã duyệt (Cộng tồn)
                        </span>
                      ) : r.trangThai === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                          <Clock className="w-3 h-3" /> Chờ phê duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        {r.trangThai === 'PENDING' && canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={loadingId === r.id}
                              className="px-2.5 py-1 text-white bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Chạy Transaction cộng tồn kho"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{loadingId === r.id ? 'Đang duyệt...' : 'Duyệt'}</span>
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={loadingId === r.id}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold transition-colors cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReceipt(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  <span>Chi Tiết Phiếu Nhập: {selectedReceipt.maPN}</span>
                </h3>
                <div className="text-xs text-red-100 mt-0.5">
                  Kho: {selectedReceipt.kho?.tenKho} | NCC: {selectedReceipt.nhaCungCap?.tenNCC}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                title="Đóng cửa sổ (Phím Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Người lập:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedReceipt.nguoiLap?.hoTen}</span>
                </div>
                <div>
                  <span className="text-slate-500">Người duyệt:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.nguoiDuyet?.hoTen || 'Chưa duyệt'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Kết quả kiểm tra:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedReceipt.ketQuaKiemTra}</span>
                </div>
                <div>
                  <span className="text-slate-500">Trạng thái:</span>{' '}
                  <span className="font-bold text-slate-800">{selectedReceipt.trangThai}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Danh Sách Mặt Hàng & Vị Trí Xếp Vào Ô</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Sản Phẩm</th>
                        <th className="p-2.5">Vị Trí Lưu Kho (Ô)</th>
                        <th className="p-2.5 text-center">SL Thực Nhập</th>
                        <th className="p-2.5 text-right">Đơn Giá</th>
                        <th className="p-2.5 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReceipt.chiTiet.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-800">{item.hangHoa?.tenHH}</td>
                          <td className="p-2.5">
                            <span className="bg-red-50 text-red-700 font-mono px-2 py-0.5 rounded border border-red-200">
                              {item.viTri?.maViTri}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-600">
                            +{item.slThucNhap}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">
                            {Number(item.donGiaNhap).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {Number(item.thanhTien).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right">TỔNG CỘNG TIỀN HÀNG:</td>
                        <td className="p-2.5 text-right text-red-700 text-sm">
                          {Number(selectedReceipt.tongTien).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng (Esc)
              </button>
              {selectedReceipt.trangThai === 'PENDING' && canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedReceipt.id)}
                    className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Từ Chối Phiếu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedReceipt.id)}
                    disabled={loadingId === selectedReceipt.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Phê Duyệt & Ghi Sổ Kho Ngay</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Modal */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-white" />
                <span>Lập Phiếu Nhập Kho Mới</span>
              </h3>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chọn Kho Nhập Hàng *</label>
                    <select
                      required
                      value={khoId}
                      onChange={(e) => setKhoId(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-medium"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nhà Cung Cấp Giao Hàng *</label>
                    <select
                      required
                      value={nhaCungCapId}
                      onChange={(e) => setNhaCungCapId(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-medium"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.tenNCC}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kết Quả Kiểm Tra Ngoại Quan / Chất Lượng</label>
                  <input
                    type="text"
                    value={ketQuaKiemTra}
                    onChange={(e) => setKetQuaKiemTra(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Items Line Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">Danh Sách Mặt Hàng & Phân Bổ Vị Trí Ô</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm dòng
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Sản Phẩm</th>
                          <th className="p-2.5">Xếp Vào Vị Trí Ô</th>
                          <th className="p-2.5 w-24">SL Nhập</th>
                          <th className="p-2.5 w-32">Đơn Giá (đ)</th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2">
                              <select
                                value={row.hangHoaId}
                                onChange={(e) => updateItemRow(idx, 'hangHoaId', e.target.value)}
                                className="w-full p-1.5 border border-slate-300 rounded"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.maHH} - {p.tenHH}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={row.viTriId}
                                onChange={(e) => updateItemRow(idx, 'viTriId', e.target.value)}
                                className="w-full p-1.5 border border-slate-300 rounded font-mono"
                              >
                                {availableLocations.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.maViTri} (Sức chứa: {l.currentStoredQty || 0}/{l.sucChua})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min={1}
                                value={row.slThucNhap}
                                onChange={(e) => updateItemRow(idx, 'slThucNhap', parseInt(e.target.value) || 1)}
                                className="w-full p-1.5 border border-slate-300 rounded text-center font-bold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min={0}
                                value={row.donGiaNhap}
                                onChange={(e) => updateItemRow(idx, 'donGiaNhap', parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 border border-slate-300 rounded text-right"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  Tạo Phiếu Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

