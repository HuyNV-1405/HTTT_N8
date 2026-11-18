import React, { useState, useEffect } from 'react';
import { Dispatch, Product, Kho, KhachHang, ViTriLuuTru, TonKhoItem } from '../types';
import {
  ArrowUpRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShieldAlert,
  Trash2,
  ShieldCheck,
  X,
  Phone
} from 'lucide-react';
import api from '../api/client';

interface DispatchesViewProps {
  dispatches: Dispatch[];
  products: Product[];
  warehouses: Kho[];
  customers: KhachHang[];
  locations: ViTriLuuTru[];
  inventory?: TonKhoItem[];
  onCreateDispatch: (data: any) => Promise<void>;
  onApproveDispatch: (id: string) => Promise<void>;
  onRejectDispatch: (id: string, lyDo?: string) => Promise<void>;
  canApprove: boolean;
}

export const DispatchesView: React.FC<DispatchesViewProps> = ({
  dispatches,
  products,
  warehouses,
  customers,
  locations,
  inventory = [],
  onCreateDispatch,
  onApproveDispatch,
  onRejectDispatch,
  canApprove,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDispatch(null);
        setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form state
  const [khoId, setKhoId] = useState(warehouses[0]?.id || '');
  const [khachHangId, setKhachHangId] = useState(customers[0]?.id || '');
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [sdtKH, setSdtKH] = useState(customers[0]?.sdt || '');
  const [lyDoXuat, setLyDoXuat] = useState('Xuất bán buôn cho đại lý');
  const [ghiChu, setGhiChu] = useState('');
  const [items, setItems] = useState<
    { hangHoaId: string; viTriId: string; slYeuCau: number; slThucXuat: number; donGiaXuat: number }[]
  >([]);

  const filteredDispatches = dispatches.filter((d) => {
    if (filterStatus === 'ALL') return true;
    return d.trangThai === filterStatus;
  });

  const availableLocations = locations.filter((l) => !khoId || l.khoId === khoId);

  // Lấy danh sách các vị trí ô kệ thực sự ĐANG CÓ MẶT HÀNG NÀY trong kho đã chọn
  const getLocationsForProduct = (hangHoaId: string) => {
    if (!hangHoaId) return [];

    // Tìm tất cả vị trí lưu trữ của mặt hàng này trong kho có số lượng tồn > 0
    const stockItems = (inventory || []).filter(
      (inv) =>
        inv.hangHoaId === hangHoaId &&
        (!khoId || inv.khoId === khoId) &&
        inv.soLuongTon > 0
    );

    return stockItems.map((inv) => ({
      id: inv.viTriId,
      maViTri: inv.viTri?.maViTri || inv.viTriId,
      soLuongTon: inv.soLuongTon,
      soLuongKhaDung: inv.soLuongKhaDung,
    }));
  };

  const handleKhoChange = (newKhoId: string) => {
    setKhoId(newKhoId);
    // Cập nhật lại vị trí hợp lệ cho từng dòng theo kho mới
    const updated = items.map((row) => {
      const validLocs = (inventory || []).filter(
        (inv) =>
          inv.hangHoaId === row.hangHoaId &&
          (!newKhoId || inv.khoId === newKhoId) &&
          inv.soLuongTon > 0
      );
      return {
        ...row,
        viTriId: validLocs.length > 0 ? validLocs[0].viTriId : '',
      };
    });
    setItems(updated);
  };

  const addItemRow = () => {
    if (products.length === 0) return;

    // Ưu tiên chọn sản phẩm đang CÓ TỒN KHO tại kho hiện tại
    const prodWithStock = products.find((p) => getLocationsForProduct(p.id).length > 0) || products[0];
    const validLocs = getLocationsForProduct(prodWithStock.id);
    const defaultLocId = validLocs.length > 0 ? validLocs[0].id : '';
    const initialQty = validLocs.length > 0 ? Math.min(5, Math.max(1, validLocs[0].soLuongKhaDung)) : 1;

    setItems([
      ...items,
      {
        hangHoaId: prodWithStock.id,
        viTriId: defaultLocId,
        slYeuCau: initialQty,
        slThucXuat: initialQty,
        donGiaXuat: Number(prodWithStock.giaXuat) || 0,
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
      if (p) updated[index].donGiaXuat = Number(p.giaXuat);

      // KHI ĐỔI SẢN PHẨM: Tự động lọc các vị trí chứa sản phẩm đó và chọn vị trí đầu tiên
      const validLocs = getLocationsForProduct(value);
      if (validLocs.length > 0) {
        updated[index].viTriId = validLocs[0].id;
        // Đặt số lượng mặc định không vượt quá tồn khả dụng
        const maxAvail = validLocs[0].soLuongKhaDung;
        const currentQty = updated[index].slThucXuat || 1;
        const newQty = maxAvail > 0 ? Math.min(currentQty, maxAvail) : 1;
        updated[index].slThucXuat = newQty;
        updated[index].slYeuCau = newQty;
      } else {
        updated[index].viTriId = '';
      }
    }

    if (field === 'viTriId') {
      const validLocs = getLocationsForProduct(updated[index].hangHoaId);
      const chosenLoc = validLocs.find((l) => l.id === value);
      if (chosenLoc && chosenLoc.soLuongKhaDung > 0) {
        if (updated[index].slThucXuat > chosenLoc.soLuongKhaDung) {
          updated[index].slThucXuat = chosenLoc.soLuongKhaDung;
          updated[index].slYeuCau = chosenLoc.soLuongKhaDung;
        }
      }
    }

    setItems(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu xuất');
      return;
    }

    // Kiểm tra có dòng nào chưa chọn vị trí hợp lệ hoặc mặt hàng hết tồn
    const invalidRow = items.find((i) => !i.viTriId);
    if (invalidRow) {
      const p = products.find((prod) => prod.id === invalidRow.hangHoaId);
      alert(`Mặt hàng "${p?.tenHH || 'đã chọn'}" hiện không có vị trí nào còn tồn kho khả dụng để xuất. Vui lòng kiểm tra lại!`);
      return;
    }

    if (isCustomCustomer && !customCustomerName.trim()) {
      alert('Vui lòng nhập tên Khách Hàng mới');
      return;
    }

    try {
      // 1. Kiểm tra tồn trước khi gửi request tạo phiếu
      const checkRes = await api.post('/dispatches/check-availability', {
        khoId,
        items: items.map((i) => ({
          hangHoaId: i.hangHoaId,
          viTriId: i.viTriId,
          soLuong: i.slThucXuat,
        })),
      });

      if (!checkRes.data.data.allAvailable) {
        const thieu = checkRes.data.data.results
          .filter((r: any) => !r.isDuHang)
          .map((r: any) => `${r.tenHH} (Yêu cầu: ${r.soLuongYeuCau}, Tồn khả dụng: ${r.soLuongKhaDung})`)
          .join('\n');
        alert(`Không thể lập phiếu xuất do không đủ tồn kho:\n${thieu}`);
        return;
      }

      await onCreateDispatch({
        khoId,
        khachHangId: isCustomCustomer ? undefined : khachHangId,
        tenKhachHangMoi: isCustomCustomer ? customCustomerName.trim() : undefined,
        sdtKhachHangMoi: isCustomCustomer ? sdtKH.trim() : undefined,
        lyDoXuat,
        ghiChu,
        items,
      });

      setShowCreateModal(false);
      setItems([]);
      setGhiChu('');
      setIsCustomCustomer(false);
      setCustomCustomerName('');
      setSdtKH(customers[0]?.sdt || '');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi lập phiếu xuất');
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Xác nhận PHÊ DUYỆT xuất kho? Hệ thống sẽ chạy Database Transaction để TRỪ TỒN KHO và sinh Cảnh Báo nếu dưới định mức tối thiểu.')) {
      return;
    }
    setLoadingId(id);
    try {
      await onApproveDispatch(id);
      if (selectedDispatch?.id === id) {
        setSelectedDispatch(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi duyệt phiếu xuất');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const lyDo = prompt('Nhập lý do từ chối phiếu xuất kho:');
    if (lyDo === null) return;
    setLoadingId(id);
    try {
      await onRejectDispatch(id, lyDo);
      if (selectedDispatch?.id === id) {
        setSelectedDispatch(null);
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
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Quản Lý Xuất Kho</h2>
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
          <span>Lập Phiếu Xuất Mới</span>
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
            {st === 'APPROVED' && 'Đã Trừ Kho (Approved)'}
            {st === 'REJECTED' && 'Bị Từ Chối (Rejected)'}
          </button>
        ))}
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã Phiếu</th>
                <th className="p-3.5">Tên Sản Phẩm</th>
                <th className="p-3.5">Khách Hàng</th>
                <th className="p-3.5">Người Lập</th>
                <th className="p-3.5">Lý Do Xuất</th>
                <th className="p-3.5 text-center">Số Mặt Hàng</th>
                <th className="p-3.5 text-right">Tổng Tiền</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Không có phiếu xuất nào ở trạng thái này
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" />
                      <span>{d.maPX}</span>
                    </td>
                    <td className="p-3.5">
                      {d.chiTiet && d.chiTiet.length > 0 ? (
                        <div>
                          <div className="font-semibold text-slate-800 line-clamp-1 max-w-[240px]">
                            {d.chiTiet[0].hangHoa?.tenHH || 'Chưa xác định'}
                          </div>
                          {d.chiTiet.length > 1 ? (
                            <div className="text-[10px] text-red-600 font-medium">
                              +{d.chiTiet.length - 1} mặt hàng khác
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {d.chiTiet[0].hangHoa?.maHH}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Chưa có chi tiết</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="font-medium text-slate-800">{d.khachHang?.tenKH}</div>
                      {d.khachHang?.sdt && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{d.khachHang.sdt}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="font-medium text-slate-800">{d.nguoiLap?.hoTen || '---'}</div>
                      <div className="text-[10px] text-slate-400">
                        {d.ngayXuat ? new Date(d.ngayXuat).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-[200px] truncate">{d.lyDoXuat}</td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {d.chiTiet?.length || 0} mục
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {Number(d.tongTien).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3.5 text-center">
                      {d.trangThai === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã trừ tồn kho
                        </span>
                      ) : d.trangThai === 'PENDING' ? (
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
                          onClick={() => setSelectedDispatch(d)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        {d.trangThai === 'PENDING' && canApprove && (
                          <>
                            <button
                              onClick={() => handleApprove(d.id)}
                              disabled={loadingId === d.id}
                              className="px-2.5 py-1 text-white bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Chạy Transaction trừ tồn kho"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{loadingId === d.id ? 'Đang duyệt...' : 'Duyệt'}</span>
                            </button>
                            <button
                              onClick={() => handleReject(d.id)}
                              disabled={loadingId === d.id}
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

      {/* Dispatch Detail Modal */}
      {selectedDispatch && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDispatch(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  <span>Chi Tiết Phiếu Xuất: {selectedDispatch.maPX}</span>
                </h3>
                <div className="text-xs text-red-100 mt-0.5">
                  Kho xuất: {selectedDispatch.kho?.tenKho} | Khách hàng: {selectedDispatch.khachHang?.tenKH}
                  {selectedDispatch.khachHang?.sdt ? ` (SĐT: ${selectedDispatch.khachHang.sdt})` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispatch(null)}
                title="Đóng cửa sổ (Phím Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block mb-0.5">Khách hàng nhận:</span>
                  <span className="font-semibold text-slate-800">{selectedDispatch.khachHang?.tenKH || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Số điện thoại KH:</span>
                  <span className="font-bold text-red-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{selectedDispatch.khachHang?.sdt || 'Chưa cập nhật'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Trạng thái:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    selectedDispatch.trangThai === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    selectedDispatch.trangThai === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedDispatch.trangThai}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Lý do xuất:</span>
                  <span className="font-semibold text-slate-800">{selectedDispatch.lyDoXuat || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Người lập phiếu:</span>
                  <span className="font-semibold text-slate-800">{selectedDispatch.nguoiLap?.hoTen || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Người duyệt:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDispatch.nguoiDuyet?.hoTen || 'Chưa duyệt'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Danh Sách Mặt Hàng & Vị Trí Ô Lấy Hàng</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Sản Phẩm</th>
                        <th className="p-2.5">Lấy Từ Ô Vị Trí</th>
                        <th className="p-2.5 text-center">SL Thực Xuất</th>
                        <th className="p-2.5 text-right">Đơn Giá</th>
                        <th className="p-2.5 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDispatch.chiTiet.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-800">{item.hangHoa?.tenHH}</td>
                          <td className="p-2.5">
                            <span className="bg-red-50 text-red-700 font-mono px-2 py-0.5 rounded border border-red-200">
                              {item.viTri?.maViTri}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-rose-600">
                            -{item.slThucXuat}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">
                            {Number(item.donGiaXuat).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {Number(item.thanhTien).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right">TỔNG CỘNG TIỀN XUẤT:</td>
                        <td className="p-2.5 text-right text-red-700 text-sm">
                          {Number(selectedDispatch.tongTien).toLocaleString('vi-VN')} đ
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
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng (Esc)
              </button>
              {selectedDispatch.trangThai === 'PENDING' && canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedDispatch.id)}
                    className="px-4 py-2 border border-rose-300 text-rose-600 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Từ Chối Phiếu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedDispatch.id)}
                    disabled={loadingId === selectedDispatch.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Phê Duyệt & Trừ Tồn Kho Ngay</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Dispatch Modal */}
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
                <ArrowUpRight className="w-5 h-5 text-white" />
                <span>Lập Phiếu Xuất Kho Mới</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chọn Kho Xuất Hàng *</label>
                    <select
                      required
                      value={khoId}
                      onChange={(e) => handleKhoChange(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-medium"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.tenKho} ({w.maKho})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Khách Hàng *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCustomCustomer;
                          setIsCustomCustomer(next);
                          if (next) {
                            setCustomCustomerName('');
                            setSdtKH('');
                          } else {
                            const found = customers.find((c) => c.id === khachHangId);
                            setSdtKH(found?.sdt || '');
                          }
                        }}
                        className="text-[11px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                      >
                        {isCustomCustomer ? '← Chọn sẵn' : '+ Tự nhập mới'}
                      </button>
                    </div>

                    {isCustomCustomer ? (
                      <input
                        type="text"
                        required
                        placeholder="Nhập tên Khách Hàng mới..."
                        value={customCustomerName}
                        onChange={(e) => setCustomCustomerName(e.target.value)}
                        className="w-full p-2.5 border border-red-300 bg-red-50/20 rounded-lg focus:ring-2 focus:ring-red-500 font-medium text-slate-800"
                      />
                    ) : (
                      <select
                        required
                        value={khachHangId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsCustomCustomer(true);
                            setCustomCustomerName('');
                            setSdtKH('');
                          } else {
                            setKhachHangId(e.target.value);
                            const found = customers.find((c) => c.id === e.target.value);
                            setSdtKH(found?.sdt || '');
                          }
                        }}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-medium"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.tenKH}</option>
                        ))}
                        <option value="__NEW__">+ Tự nhập Khách Hàng mới...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số Điện Thoại KH {isCustomCustomer ? '(Tự nhập)' : '(Có sẵn)'}
                    </label>
                    <input
                      type="tel"
                      placeholder={isCustomCustomer ? "Nhập số điện thoại..." : "Chưa có SĐT"}
                      value={sdtKH}
                      onChange={(e) => isCustomCustomer && setSdtKH(e.target.value)}
                      readOnly={!isCustomCustomer}
                      className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-colors ${
                        !isCustomCustomer
                          ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-default'
                          : 'bg-white border-slate-300 focus:ring-2 focus:ring-red-500 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lý Do Xuất Hàng *</label>
                  <input
                    type="text"
                    required
                    value={lyDoXuat}
                    onChange={(e) => setLyDoXuat(e.target.value)}
                    placeholder="VD: Xuất bán buôn, Xuất đại lý, Xuất luân chuyển..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Items Line Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">Danh Sách Mặt Hàng & Vị Trí Lấy Hàng</label>
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
                          <th className="p-2.5">Lấy Từ Ô Vị Trí</th>
                          <th className="p-2.5 w-24">SL Xuất</th>
                          <th className="p-2.5 w-32">Đơn Giá Bán (đ)</th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((row, idx) => {
                          const validLocs = getLocationsForProduct(row.hangHoaId);
                          const selectedLoc = validLocs.find((l) => l.id === row.viTriId);
                          const isOutOfStock = validLocs.length === 0;

                          return (
                            <tr key={idx} className={isOutOfStock ? 'bg-amber-50/50' : ''}>
                              <td className="p-2">
                                <select
                                  value={row.hangHoaId}
                                  onChange={(e) => updateItemRow(idx, 'hangHoaId', e.target.value)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-slate-800 font-medium text-xs"
                                >
                                  {products.map((p) => {
                                    const pLocs = getLocationsForProduct(p.id);
                                    const totalAvail = pLocs.reduce((sum, l) => sum + l.soLuongKhaDung, 0);
                                    return (
                                      <option key={p.id} value={p.id}>
                                        {p.maHH} - {p.tenHH} {totalAvail > 0 ? `(Có sẵn ${totalAvail} ${p.donViTinh || ''})` : '(Hết hàng)'}
                                      </option>
                                    );
                                  })}
                                </select>
                                {isOutOfStock && (
                                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                                    ⚠️ Mặt hàng này hiện không có tồn kho tại ô kệ nào.
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <select
                                  required
                                  value={row.viTriId}
                                  onChange={(e) => updateItemRow(idx, 'viTriId', e.target.value)}
                                  className={`w-full p-1.5 border rounded font-mono text-xs ${
                                    isOutOfStock
                                      ? 'border-amber-300 bg-amber-50 text-amber-800 font-bold'
                                      : 'border-slate-300 bg-white text-slate-800'
                                  }`}
                                >
                                  {validLocs.length === 0 ? (
                                    <option value="" disabled>
                                      -- Không có ô vị trí chứa hàng --
                                    </option>
                                  ) : (
                                    validLocs.map((l) => (
                                      <option key={l.id} value={l.id}>
                                        {l.maViTri} (Khả dụng: {l.soLuongKhaDung} / Tồn: {l.soLuongTon})
                                      </option>
                                    ))
                                  )}
                                </select>
                                {selectedLoc && (
                                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                    ✓ Có sẵn {selectedLoc.soLuongKhaDung} sản phẩm tại ô này
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={selectedLoc ? selectedLoc.soLuongKhaDung : undefined}
                                  value={row.slThucXuat}
                                  onChange={(e) => updateItemRow(idx, 'slThucXuat', parseInt(e.target.value) || 1)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={row.donGiaXuat}
                                  onChange={(e) => updateItemRow(idx, 'donGiaXuat', parseFloat(e.target.value) || 0)}
                                  className="w-full p-1.5 border border-slate-300 rounded text-right"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItemRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
                  Kiểm Tra Tồn & Tạo Phiếu Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

