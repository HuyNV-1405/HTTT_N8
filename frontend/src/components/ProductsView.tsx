import React, { useState, useEffect } from 'react';
import { Product, LoaiHang, NhaCungCap, ViTriLuuTru } from '../types';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Package,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Info,
  MapPin,
  Check,
  X,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  categories: LoaiHang[];
  suppliers: NhaCungCap[];
  locations: ViTriLuuTru[];
  onAddProduct: (data: any) => Promise<void>;
  onAdjustStock: (data: {
    hangHoaId: string;
    viTriId?: string;
    khoId?: string;
    soLuongMoi: number;
    lyDo: string;
    dieuChinhTongTon?: boolean;
  }) => Promise<void>;
  canManage: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  suppliers,
  locations,
  onAddProduct,
  onAdjustStock,
  canManage,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form thêm sản phẩm mới
  const [formData, setFormData] = useState({
    maHH: '',
    tenHH: '',
    donViTinh: 'Chiếc',
    giaNhap: '',
    giaXuat: '',
    dinhMucToiThieu: '10',
    dinhMucToiDa: '500',
    loaiHangId: '',
    nhaCungCapId: '',
    moTa: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State điều chỉnh tồn kho thủ công
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustSlotId, setAdjustSlotId] = useState<string>('');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Kiểm kê định kỳ');
  const [isTotalAdjustment, setIsTotalAdjustment] = useState<boolean>(true);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Lắng nghe phím Escape để đóng modal ngay lập tức
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAdjustingProduct(null);
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.tenHH.toLowerCase().includes(search.toLowerCase()) ||
      p.maHH.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.loaiHangId === selectedCat;
    return matchSearch && matchCat;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maHH || !formData.tenHH || !formData.loaiHangId) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddProduct({
        ...formData,
        giaNhap: parseFloat(formData.giaNhap) || 0,
        giaXuat: parseFloat(formData.giaXuat) || 0,
        dinhMucToiThieu: parseInt(formData.dinhMucToiThieu) || 10,
        dinhMucToiDa: parseInt(formData.dinhMucToiDa) || 500,
      });
      setShowAddModal(false);
      setFormData({
        maHH: '',
        tenHH: '',
        donViTinh: 'Chiếc',
        giaNhap: '',
        giaXuat: '',
        dinhMucToiThieu: '10',
        dinhMucToiDa: '500',
        loaiHangId: '',
        nhaCungCapId: '',
        moTa: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi thêm sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustQty(p.tongTon);
    setIsTotalAdjustment(true);

    // Xác định vị trí mặc định nếu sản phẩm đã có trong kho
    const existingSlot = p.tonKho && p.tonKho.length > 0 ? p.tonKho[0].viTriId : locations[0]?.id || '';
    setAdjustSlotId(existingSlot);
    setAdjustReason('Kiểm kê kho thực tế');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (adjustQty < 0) {
      alert('Số lượng tồn không thể là số âm');
      return;
    }

    const selectedLoc = locations.find((l) => l.id === adjustSlotId);
    if (selectedLoc) {
      const otherItems = (selectedLoc.tonKho || [])
        .filter((tk) => tk.hangHoaId !== adjustingProduct.id)
        .reduce((sum, tk) => sum + tk.soLuongTon, 0);
      const maxCap = Math.max(0, selectedLoc.sucChua - otherItems);
      if (adjustQty > maxCap) {
        alert(`Vượt quá hạn mức: Vị trí "${selectedLoc.maViTri}" chỉ chứa tối đa ${selectedLoc.sucChua} sản phẩm. Không thể lưu trữ ${adjustQty} sản phẩm!`);
        return;
      }
    }

    if (!adjustReason.trim()) {
      alert('Vui lòng nhập lý do điều chỉnh tồn kho');
      return;
    }

    setIsAdjusting(true);
    try {
      await onAdjustStock({
        hangHoaId: adjustingProduct.id,
        viTriId: adjustSlotId || undefined,
        soLuongMoi: adjustQty,
        lyDo: adjustReason.trim(),
        dieuChinhTongTon: isTotalAdjustment,
      });
      setAdjustingProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi điều chỉnh tồn kho');
    } finally {
      setIsAdjusting(false);
    }
  };

  const quickReasons = [
    'Kiểm kê định kỳ phát hiện chênh lệch',
    'Hao hụt / Rơi vỡ / Hàng hỏng',
    'Nhập bù số lượng bỏ sót',
    'Xuất bù chưa trừ sổ sách',
    'Cân chỉnh số liệu tồn thực tế',
  ];

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Danh Mục Hàng Hóa & Định Mức</h2>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã hàng hoặc tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả danh mục ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tenLoai}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã Hàng</th>
                <th className="p-3.5">Tên Sản Phẩm</th>
                <th className="p-3.5">Danh Mục</th>
                <th className="p-3.5">ĐVT</th>
                <th className="p-3.5 text-right">Giá Vốn</th>
                <th className="p-3.5 text-right">Giá Bán</th>
                <th className="p-3.5 text-center">Định Mức (Min - Max)</th>
                <th className="p-3.5 text-center">
                  <div className="inline-flex items-center gap-1 text-slate-800 font-bold">
                    <span>Tổng Tồn Kho</span>
                    <span className="text-[10px] lowercase font-normal bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.2 rounded">sửa</span>
                  </div>
                </th>
                <th className="p-3.5 text-center">Tình Trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isUnderMin = p.tongTon < p.dinhMucToiThieu;
                  const isOutOfStock = p.tongTon === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-700">{p.maHH}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{p.tenHH}</div>
                        <div className="text-[11px] text-slate-500">{p.nhaCungCap?.tenNCC || 'Chưa gán NCC'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {p.loaiHang?.tenLoai}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{p.donViTinh}</td>
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {Number(p.giaNhap).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-900">
                        {Number(p.giaXuat).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3.5 text-center text-slate-500">
                        <span className="font-medium text-rose-600">{p.dinhMucToiThieu}</span>
                        <span className="mx-1">-</span>
                        <span className="font-medium text-slate-700">{p.dinhMucToiDa}</span>
                      </td>
                      {/* Cột Tổng Tồn Kho có thể click để điều chỉnh thủ công */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(p)}
                          title="Nhấp vào đây để điều chỉnh số lượng tồn kho thủ công"
                          className={`group relative inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-full border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${isOutOfStock
                            ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                            : isUnderMin
                              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            }`}
                        >
                          <span>{p.tongTon}</span>
                          <SlidersHorizontal className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Hết Hàng
                          </span>
                        ) : isUnderMin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Dưới Định Mức
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> An Toàn
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

      {/* Modal Điều Chỉnh Tồn Kho Thủ Công (Manual Stock Adjustment Modal) */}
      {adjustingProduct && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAdjustingProduct(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Luôn cố định ở trên cùng với nút X rõ ràng) */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Điều Chỉnh Tồn Kho Thủ Công</h3>
                  <p className="text-[11px] text-red-100">Cập nhật trực tiếp số dư kho và đồng bộ sổ kho</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                title="Đóng cửa sổ (Phím Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form với thanh cuộn độc lập */}
            <form onSubmit={handleAdjustSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                {/* Product Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-sm">
                      {adjustingProduct.maHH} - {adjustingProduct.tenHH}
                    </div>
                    <span className="bg-red-50 text-red-700 border border-red-200 font-semibold px-2 py-0.5 rounded text-[11px]">
                      {adjustingProduct.donViTinh}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">TỒN HIỆN TẠI</div>
                      <div className="font-bold text-slate-800 text-sm">{adjustingProduct.tongTon}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">ĐỊNH MỨC MIN</div>
                      <div className="font-bold text-rose-600 text-sm">{adjustingProduct.dinhMucToiThieu}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-medium">ĐỊNH MỨC MAX</div>
                      <div className="font-bold text-slate-700 text-sm">{adjustingProduct.dinhMucToiDa}</div>
                    </div>
                  </div>
                </div>

                {/* Multi-slot breakdown if stored in multiple locations */}
                {adjustingProduct.tonKho && adjustingProduct.tonKho.length > 1 && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="font-bold text-amber-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        Mặt hàng này đang nằm ở {adjustingProduct.tonKho.length} vị trí ô khác nhau:
                      </span>
                      <span className="font-bold text-amber-950">Tổng: {adjustingProduct.tongTon} {adjustingProduct.donViTinh}</span>
                    </div>
                    <div className="divide-y divide-amber-200/60 text-[11px] text-amber-800">
                      {adjustingProduct.tonKho.map((tk) => (
                        <div key={tk.id} className="py-1 flex items-center justify-between">
                          <span>• Ô {tk.viTri?.maViTri} ({tk.viTri?.khuVuc?.tenKhuVuc || 'Khu chung'}):</span>
                          <span className="font-semibold text-amber-950">{tk.soLuongTon} {adjustingProduct.donViTinh}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slot Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Vị Trí Ô Lưu Trữ Trong Kho</span>
                  </label>
                  <select
                    value={adjustSlotId}
                    onChange={(e) => setAdjustSlotId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {locations.map((loc) => {
                      const isCurrent = adjustingProduct.tonKho?.some((t) => t.viTriId === loc.id);
                      return (
                        <option key={loc.id} value={loc.id}>
                          {loc.maViTri} - {loc.khuVuc?.tenKhuVuc || 'Khu chung'} (Kệ {loc.ke}, Tầng {loc.tang}, Ô {loc.o})
                          {isCurrent ? ' [Đang chứa hàng]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Option to set total stock vs slot stock */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer text-xs transition-colors hover:bg-red-50">
                  <input
                    type="checkbox"
                    checked={isTotalAdjustment}
                    onChange={(e) => setIsTotalAdjustment(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-red-950">
                      Đặt số lượng này làm TỔNG TỒN KHO của mặt hàng
                    </div>
                    <div className="text-[11px] text-red-700 mt-0.5">
                      Hệ thống sẽ cập nhật <strong>Tổng Tồn Kho</strong> của mặt hàng ngoài danh mục chính xác bằng <strong>{adjustQty} {adjustingProduct.donViTinh}</strong> (lưu tại ô được chọn, đưa các ô phụ khác về 0).
                    </div>
                  </div>
                </label>

                {!isTotalAdjustment && (() => {
                  const otherTotal = (adjustingProduct.tonKho || [])
                    .filter((t) => t.viTriId !== adjustSlotId)
                    .reduce((sum, t) => sum + t.soLuongTon, 0);
                  const finalTotal = adjustQty + otherTotal;
                  return (
                    <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700">
                      Tính toán tổng tồn: Ô đang chọn ({adjustQty}) + Các ô khác ({otherTotal}) = <strong className="text-slate-900">{finalTotal} {adjustingProduct.donViTinh}</strong> ngoài danh mục.
                    </div>
                  );
                })()}

                {/* New Quantity Input with Diff */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Số Lượng Tồn Thực Tế Mới *</label>
                    {/* Live Difference Badge */}
                    {(() => {
                      const diff = adjustQty - adjustingProduct.tongTon;
                      if (diff > 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            <TrendingUp className="w-3 h-3" />
                            +{diff} {adjustingProduct.donViTinh} (Tăng tồn)
                          </span>
                        );
                      }
                      if (diff < 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            <TrendingDown className="w-3 h-3" />
                            {diff} {adjustingProduct.donViTinh} (Giảm tồn)
                          </span>
                        );
                      }
                      return (
                        <span className="text-[11px] text-slate-400 font-medium">Không thay đổi</span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => Math.max(0, prev - 10))}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => Math.max(0, prev - 1))}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      min="0"
                      required
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                      className="flex-1 text-center font-bold text-lg p-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => prev + 1)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => prev + 10)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      +10
                    </button>
                  </div>

                  {/* Strict Capacity Error if exceeding slot capacity */}
                  {(() => {
                    const currentSelectedSlot = locations.find((l) => l.id === adjustSlotId);
                    const slotCapacity = currentSelectedSlot ? currentSelectedSlot.sucChua : 999999;
                    const otherItemsInSlot = (currentSelectedSlot?.tonKho || [])
                      .filter((tk) => tk.hangHoaId !== adjustingProduct.id)
                      .reduce((sum, tk) => sum + tk.soLuongTon, 0);
                    const maxSlotAvailable = Math.max(0, slotCapacity - otherItemsInSlot);
                    if (adjustQty > maxSlotAvailable) {
                      return (
                        <div className="mt-2 flex items-center gap-1.5 p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px] font-semibold animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            Vượt quá hạn mức chứa: Ô "{currentSelectedSlot?.maViTri}" có hạn mức sức chứa tối đa là {slotCapacity} sản phẩm{otherItemsInSlot > 0 ? ` (đã chứa ${otherItemsInSlot} sản phẩm khác)` : ''}. Không thể chứa thêm quá {maxSlotAvailable} sản phẩm!
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Reason Selection & Input */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Lý Do Điều Chỉnh (Ghi nhận sổ kho) *</label>

                  {/* Quick preset chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {quickReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setAdjustReason(reason)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${adjustReason === reason
                          ? 'bg-red-600 text-white border-red-600 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    required
                    placeholder="Ghi rõ lý do (VD: Kiểm kê kho đột xuất ngày 16/11, phát hiện sai lệch số liệu...)"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons Footer (Luôn cố định ở đáy modal) */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy Bỏ (Esc)
                </button>
                {(() => {
                  const selectedLoc = locations.find((l) => l.id === adjustSlotId);
                  const otherItems = (selectedLoc?.tonKho || [])
                    .filter((tk) => tk.hangHoaId !== adjustingProduct.id)
                    .reduce((sum, tk) => sum + tk.soLuongTon, 0);
                  const maxCap = selectedLoc ? selectedLoc.sucChua - otherItems : 999999;
                  const isOverCap = adjustQty > maxCap;

                  return (
                    <button
                      type="submit"
                      disabled={isAdjusting || isOverCap}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm transition-all cursor-pointer ${isOverCap
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                      {isAdjusting ? (
                        <span>Đang cập nhật...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{isOverCap ? 'Vượt quá hạn mức ô' : 'Xác Nhận Cập Nhật Tồn'}</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <h3 className="font-bold text-white text-base">Thêm Sản Phẩm Mới Vào Hệ Thống</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                title="Đóng (Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã Sản Phẩm *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: SP-NEW-01"
                      value={formData.maHH}
                      onChange={(e) => setFormData({ ...formData, maHH: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Tính *</label>
                    <input
                      type="text"
                      required
                      placeholder="Cái, Chiếc, Thùng..."
                      value={formData.donViTinh}
                      onChange={(e) => setFormData({ ...formData, donViTinh: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Hàng Hóa *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Smart Tivi Samsung Crystal UHD 4K 55 inch"
                    value={formData.tenHH}
                    onChange={(e) => setFormData({ ...formData, tenHH: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Danh Mục Hàng *</label>
                    <select
                      required
                      value={formData.loaiHangId}
                      onChange={(e) => setFormData({ ...formData, loaiHangId: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.tenLoai}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nhà Cung Cấp</label>
                    <select
                      value={formData.nhaCungCapId}
                      onChange={(e) => setFormData({ ...formData, nhaCungCapId: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.tenNCC}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Giá Vốn Nhập (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="VD: 8500000"
                      value={formData.giaNhap}
                      onChange={(e) => setFormData({ ...formData, giaNhap: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Giá Xuất Bán (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="VD: 11200000"
                      value={formData.giaXuat}
                      onChange={(e) => setFormData({ ...formData, giaXuat: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mức Tồn Tối Thiểu (Min)</label>
                    <input
                      type="number"
                      value={formData.dinhMucToiThieu}
                      onChange={(e) => setFormData({ ...formData, dinhMucToiThieu: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mức Tồn Tối Đa (Max)</label>
                    <input
                      type="number"
                      value={formData.dinhMucToiDa}
                      onChange={(e) => setFormData({ ...formData, dinhMucToiDa: e.target.value })}
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};