import React, { useState, useEffect } from 'react';
import { Kho, Product, ViTriLuuTru, TonKhoItem } from '../types';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShieldCheck,
  MapPin,
  ArrowRight,
  X,
  Edit2,
} from 'lucide-react';

interface TransfersViewProps {
  transfers: any[];
  warehouses: Kho[];
  products: Product[];
  locations: ViTriLuuTru[];
  inventory?: TonKhoItem[];
  onCreateTransfer: (data: any) => Promise<void>;
  onApproveTransfer: (id: string) => Promise<void>;
  onRejectTransfer?: (id: string, lyDo?: string) => Promise<void>;
  onUpdateTransfer?: (id: string, data: any) => Promise<void>;
  canApprove: boolean;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  transfers,
  warehouses,
  products,
  locations,
  inventory = [],
  onCreateTransfer,
  onApproveTransfer,
  onRejectTransfer,
  onUpdateTransfer,
  canApprove,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);
  const [editingTransferCode, setEditingTransferCode] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Vì hệ thống quản lý 1 kho, khoId là kho duy nhất của hệ thống
  const currentKho = warehouses[0];
  const [hangHoaId, setHangHoaId] = useState('');
  const [viTriDiId, setViTriDiId] = useState('');
  const [viTriDenId, setViTriDenId] = useState('');
  const [slChuyen, setSlChuyen] = useState(5);
  const [ghiChu, setGhiChu] = useState('Sắp xếp lại vị trí lưu trữ trong kho');

  // Hàng hóa đang chọn
  const selectedProduct = products.find((p) => p.id === hangHoaId);
  const donViTinh = selectedProduct?.donViTinh || 'SP';

  // Tất cả vị trí đang có tồn kho của mặt hàng này tại kho hiện tại (soLuongKhaDung > 0)
  const allStockLocationsForProduct = (inventory || []).filter(
    (inv) =>
      inv.hangHoaId === hangHoaId &&
      (!currentKho?.id || inv.khoId === currentKho.id) &&
      inv.soLuongKhaDung > 0
  );

  // Chỉ lấy những vị trí ĐỦ số lượng cần chuyển (soLuongKhaDung >= slChuyen)
  const validSourceLocations = allStockLocationsForProduct.filter(
    (inv) => inv.soLuongKhaDung >= (slChuyen || 1)
  );

  // Vị trí có tồn kho khả dụng lớn nhất (để gợi ý khi người dùng nhập số lượng vượt quá bất kỳ ô nào)
  const maxStockLocation = allStockLocationsForProduct.reduce(
    (prev, current) => (current.soLuongKhaDung > (prev?.soLuongKhaDung || 0) ? current : prev),
    allStockLocationsForProduct[0] || null
  );

  // Thông tin tồn kho của vị trí đi đang được chọn
  const selectedSourceStock = allStockLocationsForProduct.find(
    (inv) => inv.viTriId === viTriDiId
  );

  // Vị trí đến hợp lệ (loại trừ vị trí đi)
  const availableDestLocations = locations.filter((l) => l.id !== viTriDiId);
  const selectedDestLoc = locations.find((l) => l.id === viTriDenId);

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

  // Tự động đồng bộ viTriDiId với danh sách vị trí hợp lệ khi chọn sản phẩm hoặc số lượng thay đổi
  useEffect(() => {
    if (editingTransferId) return;
    if (validSourceLocations.length > 0) {
      const isCurrentValid = validSourceLocations.some((inv) => inv.viTriId === viTriDiId);
      if (!isCurrentValid) {
        setViTriDiId(validSourceLocations[0].viTriId);
      }
    } else {
      setViTriDiId('');
    }
  }, [hangHoaId, slChuyen, inventory, editingTransferId]);

  // Đảm bảo vị trí đến không trùng vị trí đi
  useEffect(() => {
    if (viTriDiId && viTriDenId === viTriDiId) {
      const nextDest = locations.find((l) => l.id !== viTriDiId);
      if (nextDest) {
        setViTriDenId(nextDest.id);
      }
    }
  }, [viTriDiId, viTriDenId, locations]);

  const handleOpenModal = () => {
    setEditingTransferId(null);
    setEditingTransferCode(null);
    setShowCreateModal(true);

    // Ưu tiên chọn sản phẩm CÓ HÀNG trong kho
    const prodWithStock = products.find((p) =>
      (inventory || []).some(
        (inv) =>
          inv.hangHoaId === p.id &&
          (!currentKho?.id || inv.khoId === currentKho.id) &&
          inv.soLuongKhaDung > 0
      )
    ) || products[0];

    const currentProdId = prodWithStock ? prodWithStock.id : (products[0]?.id || '');
    setHangHoaId(currentProdId);

    const locs = (inventory || []).filter(
      (inv) =>
        inv.hangHoaId === currentProdId &&
        (!currentKho?.id || inv.khoId === currentKho.id) &&
        inv.soLuongKhaDung > 0
    );

    if (locs.length > 0) {
      const defaultLoc = locs[0];
      setViTriDiId(defaultLoc.viTriId);
      const initialQty = Math.min(5, defaultLoc.soLuongKhaDung);
      setSlChuyen(initialQty > 0 ? initialQty : 1);
      const dest = locations.find((l) => l.id !== defaultLoc.viTriId);
      if (dest) setViTriDenId(dest.id);
    } else {
      setViTriDiId('');
      setSlChuyen(1);
      if (locations.length > 0) setViTriDenId(locations[0].id);
    }
    setGhiChu('Sắp xếp lại vị trí lưu trữ trong kho');
  };

  const handleOpenEditModal = (t: any) => {
    const item = t.chiTiet?.[0];
    if (!item) return;

    setEditingTransferId(t.id);
    setEditingTransferCode(t.maPC);
    setHangHoaId(item.hangHoaId);
    setViTriDiId(item.viTriDiId);
    setViTriDenId(item.viTriDenId);
    setSlChuyen(item.slChuyen);
    setGhiChu(item.ghiChu || t.ghiChu || 'Sắp xếp lại vị trí lưu trữ trong kho');
    setShowCreateModal(true);
  };

  const handleProductChange = (newProductId: string) => {
    setHangHoaId(newProductId);

    const locs = (inventory || []).filter(
      (inv) =>
        inv.hangHoaId === newProductId &&
        (!currentKho?.id || inv.khoId === currentKho.id) &&
        inv.soLuongKhaDung > 0
    );

    if (locs.length > 0) {
      const matching = locs.find((inv) => inv.soLuongKhaDung >= slChuyen);
      if (matching) {
        setViTriDiId(matching.viTriId);
      } else {
        const best = locs.reduce(
          (prev, curr) => (curr.soLuongKhaDung > prev.soLuongKhaDung ? curr : prev),
          locs[0]
        );
        setViTriDiId(best.viTriId);
        setSlChuyen(Math.min(5, best.soLuongKhaDung));
      }

      const nextDest = locations.find((l) => l.id !== locs[0].viTriId);
      if (nextDest) setViTriDenId(nextDest.id);
    } else {
      setViTriDiId('');
    }
  };

  const handleQtyChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    setSlChuyen(qty);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hangHoaId) {
      alert('Vui lòng chọn hàng hóa cần chuyển');
      return;
    }
    if (!viTriDiId) {
      alert('Vui lòng chọn Vị trí đi (nơi lấy hàng ra)');
      return;
    }
    if (!viTriDenId) {
      alert('Vui lòng chọn Vị trí đến (nơi cất hàng vào)');
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

    // Kiểm tra hàng hóa tồn tại đủ tại vị trí đi
    const sourceStock = (inventory || []).find(
      (inv) =>
        inv.hangHoaId === hangHoaId &&
        inv.viTriId === viTriDiId &&
        (!currentKho?.id || inv.khoId === currentKho.id)
    );

    if (!sourceStock || sourceStock.soLuongKhaDung < slChuyen) {
      alert(
        `Không thể chuyển: Vị trí xuất đi chỉ có ${sourceStock?.soLuongKhaDung || 0} sản phẩm khả dụng, không đủ để chuyển ${slChuyen} sản phẩm!`
      );
      return;
    }

    // Kiểm tra ràng buộc sức chứa vị trí đích
    const destLoc = locations.find((l) => l.id === viTriDenId);
    if (destLoc) {
      const remaining = Math.max(0, destLoc.sucChua - (destLoc.currentStoredQty || 0));
      if (slChuyen > remaining) {
        alert(
          `Không thể chuyển: Vị trí đích "${destLoc.maViTri}" chỉ còn trống ${remaining}/${destLoc.sucChua} sản phẩm. Số lượng chuyển (${slChuyen}) vượt quá hạn mức chứa!`
        );
        return;
      }
    }

    try {
      const payload = {
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
      };

      if (editingTransferId) {
        if (onUpdateTransfer) {
          await onUpdateTransfer(editingTransferId, payload);
        }
      } else {
        await onCreateTransfer(payload);
      }

      setShowCreateModal(false);
      setEditingTransferId(null);
      setEditingTransferCode(null);
      setGhiChu('Sắp xếp lại vị trí lưu trữ trong kho');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi lưu phiếu chuyển vị trí');
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Xác nhận PHÊ DUYỆT điều chuyển vị trí? Hệ thống sẽ kích hoạt Database Transaction để: Trừ tồn kho tại Vị trí đi và Cộng tồn kho tại Vị trí đến.')) {
      return;
    }
    setLoadingId(id);
    try {
      await onApproveTransfer(id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi duyệt phiếu chuyển');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const lyDo = prompt('Nhập lý do từ chối phiếu chuyển vị trí:');
    if (lyDo === null) return;
    setLoadingId(id);
    try {
      if (onRejectTransfer) {
        await onRejectTransfer(id, lyDo);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi từ chối phiếu chuyển');
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
                <th className="p-3.5 text-center min-w-[210px]">Thao Tác</th>
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
                        ) : t.trangThai === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Từ chối
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                            <Clock className="w-3 h-3" /> Chờ phê duyệt
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {t.trangThai === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Nút 1: Duyệt */}
                            {canApprove && (
                              <button
                                onClick={() => handleApprove(t.id)}
                                disabled={loadingId === t.id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                                title="Phê duyệt điều chuyển (Trừ ô nguồn, cộng ô đích)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{loadingId === t.id ? '...' : 'Duyệt'}</span>
                              </button>
                            )}

                            {/* Nút 2: Từ chối */}
                            {canApprove && (
                              <button
                                onClick={() => handleReject(t.id)}
                                disabled={loadingId === t.id}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-md font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                                title="Từ chối yêu cầu chuyển vị trí này"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            )}

                            {/* Nút 3: Sửa */}
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              disabled={loadingId === t.id}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 rounded-md font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                              title="Chỉnh sửa thông tin phiếu chuyển vị trí"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                          </div>
                        ) : t.trangThai === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã ghi sổ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-medium text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Đã từ chối
                          </span>
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
                  <span>
                    {editingTransferId
                      ? `Chỉnh Sửa Phiếu Chuyển Vị Trí (${editingTransferCode})`
                      : 'Lập Phiếu Chuyển Vị Trí Hàng Hóa'}
                  </span>
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

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Chọn Hàng Hóa Cần Chuyển *</label>
                    {selectedProduct && (
                      <span className="text-[11px] text-slate-500">
                        Tổng tồn tại kho:{' '}
                        <strong className="text-slate-800">
                          {allStockLocationsForProduct.reduce((sum, i) => sum + i.soLuongTon, 0)}
                        </strong>{' '}
                        {donViTinh}
                      </span>
                    )}
                  </div>
                  <select
                    value={hangHoaId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-red-500"
                  >
                    {products.map((p) => {
                      const stockInWh = (inventory || [])
                        .filter((inv) => inv.hangHoaId === p.id && (!currentKho?.id || inv.khoId === currentKho.id))
                        .reduce((sum, item) => sum + item.soLuongTon, 0);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.maHH} - {p.tenHH} (Tồn tại kho: {stockInWh} {p.donViTinh})
                        </option>
                      );
                    })}
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-rose-700">Vị Trí Đi (Lấy Hàng Ra) *</label>
                        {selectedSourceStock && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Có sẵn: {selectedSourceStock.soLuongKhaDung} {donViTinh}
                          </span>
                        )}
                      </div>
                      <select
                        value={viTriDiId}
                        onChange={(e) => setViTriDiId(e.target.value)}
                        className={`w-full p-2 border rounded-lg font-mono text-xs font-semibold focus:ring-2 ${
                          validSourceLocations.length === 0
                            ? 'border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-500'
                            : 'border-rose-300 bg-rose-50/50 text-slate-800 focus:ring-red-500'
                        }`}
                      >
                        {validSourceLocations.length === 0 ? (
                          allStockLocationsForProduct.length === 0 ? (
                            <option value="">-- Mặt hàng này không có tồn kho --</option>
                          ) : (
                            <option value="">-- Không có ô nào đủ {slChuyen} {donViTinh} --</option>
                          )
                        ) : (
                          validSourceLocations.map((inv) => (
                            <option key={inv.viTriId} value={inv.viTriId}>
                              {inv.viTri?.maViTri || inv.viTriId} (Khả dụng: {inv.soLuongKhaDung} {donViTinh} / Tồn: {inv.soLuongTon})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-emerald-700">Vị Trí Đến (Cất Hàng Vào) *</label>
                        {selectedDestLoc && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Còn trống: {Math.max(0, selectedDestLoc.sucChua - (selectedDestLoc.currentStoredQty || 0))}/{selectedDestLoc.sucChua}
                          </span>
                        )}
                      </div>
                      <select
                        value={viTriDenId}
                        onChange={(e) => setViTriDenId(e.target.value)}
                        className="w-full p-2 border border-emerald-300 bg-emerald-50/50 rounded-lg font-mono text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        {availableDestLocations.length === 0 ? (
                          <option value="">-- Không có vị trí đích khả dụng --</option>
                        ) : (
                          availableDestLocations.map((l) => {
                            const remaining = Math.max(0, l.sucChua - (l.currentStoredQty || 0));
                            const isNotEnough = remaining < slChuyen;
                            return (
                              <option
                                key={l.id}
                                value={l.id}
                                disabled={isNotEnough}
                                className={isNotEnough ? 'text-slate-400 bg-slate-100' : ''}
                              >
                                {l.maViTri} (Trống: {remaining}/{l.sucChua}{isNotEnough ? ' - Hết chỗ' : ''})
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Cảnh báo ngữ cảnh khi chọn vị trí */}
                  {allStockLocationsForProduct.length === 0 && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5">
                      <span className="shrink-0">❌</span>
                      <span>
                        Mặt hàng <b>{selectedProduct?.tenHH}</b> hiện không có tồn kho tại bất kỳ vị trí nào trong kho này. Vui lòng chọn sản phẩm khác.
                      </span>
                    </div>
                  )}

                  {allStockLocationsForProduct.length > 0 && validSourceLocations.length === 0 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0">⚠️</span>
                        <div>
                          Không có ô nào có đủ <b>{slChuyen} {donViTinh}</b> (Ô cao nhất hiện có{' '}
                          <b>{maxStockLocation?.soLuongKhaDung} {donViTinh}</b>).
                        </div>
                      </div>
                      {maxStockLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlChuyen(maxStockLocation.soLuongKhaDung);
                            setViTriDiId(maxStockLocation.viTriId);
                          }}
                          className="shrink-0 px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-bold transition-colors cursor-pointer"
                        >
                          Lấy {maxStockLocation.soLuongKhaDung} {donViTinh}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Số Lượng Chuyển *</label>
                      {selectedSourceStock && (
                        <button
                          type="button"
                          onClick={() => setSlChuyen(selectedSourceStock.soLuongKhaDung)}
                          className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer underline"
                          title="Lấy toàn bộ số lượng tại ô này"
                        >
                          Tối đa ({selectedSourceStock.soLuongKhaDung})
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={selectedSourceStock?.soLuongKhaDung || 9999}
                      value={slChuyen}
                      onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
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
                  disabled={!viTriDiId || !viTriDenId || validSourceLocations.length === 0}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {editingTransferId ? 'Lưu Thay Đổi' : 'Tạo Phiếu Chuyển Vị Trí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
