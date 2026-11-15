import React, { useState, useEffect } from 'react';
import { Kho, ViTriLuuTru, TonKhoItem } from '../types';
import {
  Warehouse,
  Layers,
  Search,
  MapPin,
  Box,
  CheckCircle2,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Info,
  Check,
  X,
} from 'lucide-react';

interface InventoryViewProps {
  warehouses: Kho[];
  locations: ViTriLuuTru[];
  inventory: TonKhoItem[];
  onAdjustStock?: (data: {
    hangHoaId: string;
    viTriId?: string;
    khoId?: string;
    soLuongMoi: number;
    lyDo: string;
  }) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  warehouses,
  locations,
  inventory,
  onAdjustStock,
}) => {
  const [selectedKhoId, setSelectedKhoId] = useState(warehouses[0]?.id || '');
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [selectedSlot, setSelectedSlot] = useState<ViTriLuuTru | null>(null);
  const [search, setSearch] = useState('');

  // State điều chỉnh tồn kho thủ công
  const [adjustItem, setAdjustItem] = useState<TonKhoItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Kiểm kê định kỳ');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (adjustItem) setAdjustItem(null);
        if (selectedSlot) setSelectedSlot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adjustItem, selectedSlot]);

  const currentKho = warehouses.find((w) => w.id === selectedKhoId) || warehouses[0];
  const khoLocations = locations.filter((l) => l.khoId === selectedKhoId);

  // Group locations by KhuVuc -> Ke
  const groupedByArea = khoLocations.reduce((acc: any, loc) => {
    const areaName = loc.khuVuc?.tenKhuVuc || 'Khu vực chung';
    if (!acc[areaName]) acc[areaName] = [];
    acc[areaName].push(loc);
    return acc;
  }, {});

  const filteredInventory = inventory.filter((item) => {
    const matchKho = !selectedKhoId || item.khoId === selectedKhoId;
    const matchSearch =
      item.hangHoa.tenHH.toLowerCase().includes(search.toLowerCase()) ||
      item.hangHoa.maHH.toLowerCase().includes(search.toLowerCase()) ||
      item.viTri.maViTri.toLowerCase().includes(search.toLowerCase());
    return matchKho && matchSearch;
  });

  const handleOpenAdjust = (item: TonKhoItem) => {
    setAdjustItem(item);
    setAdjustQty(item.soLuongTon);
    setAdjustReason('Kiểm kê kho thực tế');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || !onAdjustStock) return;
    if (adjustQty < 0) {
      alert('Số lượng tồn không thể là số âm');
      return;
    }

    const targetSlot = locations.find((l) => l.id === adjustItem.viTriId);
    if (targetSlot) {
      const otherItems = (targetSlot.tonKho || [])
        .filter((tk) => tk.hangHoaId !== adjustItem.hangHoaId)
        .reduce((sum, tk) => sum + tk.soLuongTon, 0);
      const maxCap = Math.max(0, targetSlot.sucChua - otherItems);
      if (adjustQty > maxCap) {
        alert(`Vượt quá hạn mức: Vị trí "${targetSlot.maViTri}" có hạn mức sức chứa tối đa là ${targetSlot.sucChua} sản phẩm. Không thể chứa ${adjustQty} sản phẩm!`);
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
        hangHoaId: adjustItem.hangHoaId,
        viTriId: adjustItem.viTriId,
        khoId: adjustItem.khoId,
        soLuongMoi: adjustQty,
        lyDo: adjustReason.trim(),
      });
      setAdjustItem(null);
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
      {/* Header & Warehouse Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Sơ Đồ Vị Trí & Tra Cứu Tồn Kho</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Warehouse Switcher */}
          <select
            value={selectedKhoId}
            onChange={(e) => {
              setSelectedKhoId(e.target.value);
              setSelectedSlot(null);
            }}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.tenKho} ({w.maKho})
              </option>
            ))}
          </select>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'MAP' ? 'bg-white text-red-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sơ Đồ Trực Quan
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'LIST' ? 'bg-white text-red-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng Danh Sách
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'MAP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Grid Map */}
          <div className="lg:col-span-2 space-y-6">
            {Object.keys(groupedByArea).length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
                Chưa có dữ liệu vị trí ô lưu trữ cho kho này
              </div>
            ) : (
              Object.entries(groupedByArea).map(([areaName, locs]: [string, any]) => (
                <div key={areaName} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <h3 className="font-bold text-slate-800 text-sm">{areaName}</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {locs.length} ô lưu trữ
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Trống (EMPTY)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Đang chứa (PARTIAL)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Đầy (FULL)
                      </span>
                    </div>
                  </div>

                  {/* Grid of Slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {locs.map((loc: ViTriLuuTru) => {
                      const isSelected = selectedSlot?.id === loc.id;
                      const isFull = loc.trangThai === 'FULL';
                      const isEmpty = loc.trangThai === 'EMPTY';

                      return (
                        <div
                          key={loc.id}
                          onClick={() => setSelectedSlot(loc)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-red-600 bg-red-50/50 ring-2 ring-red-500 shadow-sm'
                              : isEmpty
                              ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                              : isFull
                                ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50'
                                : 'border-blue-200 bg-blue-50/20 hover:bg-blue-50/60'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-slate-800">{loc.maViTri}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${isEmpty
                                ? 'bg-slate-200 text-slate-700'
                                : isFull
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {loc.trangThai}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Kệ {loc.ke} - Tầng {loc.tang} - Ô {loc.o}</div>
                            <div className="flex items-center justify-between pt-1">
                              <span>Chứa:</span>
                              <span className="font-bold text-slate-700">
                                {loc.currentStoredQty || 0} / {loc.sucChua}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full transition-all ${isFull ? 'bg-rose-500' : isEmpty ? 'bg-transparent' : 'bg-blue-600'
                                }`}
                              style={{ width: `${Math.min(100, loc.occupancyRate || 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Slot Detail Inspector Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-slate-800 text-sm">Chi Tiết Ô Lưu Trữ Đã Chọn</h3>
            </div>

            {selectedSlot ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mã Vị Trí:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{selectedSlot.maViTri}</span>
                  </div>
                  <div className="text-slate-600">
                    Thuộc: <span className="font-semibold">{selectedSlot.khuVuc?.tenKhuVuc}</span>
                  </div>
                  <div className="text-slate-600">
                    Sức chứa tối đa: <span className="font-semibold">{selectedSlot.sucChua}</span> sản phẩm
                  </div>
                  <div className="text-slate-600">
                    Số lượng đang chứa: <span className="font-bold text-slate-800">{selectedSlot.currentStoredQty || 0}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hàng Hóa Đang Nằm Trong Ô</span>
                  </h4>

                  {selectedSlot.tonKho && selectedSlot.tonKho.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {selectedSlot.tonKho.map((item) => (
                        <div key={item.id} className="p-3 bg-white flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800">{item.hangHoa.tenHH}</div>
                            <div className="text-[11px] text-slate-500">{item.hangHoa.maHH}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="font-bold text-sm text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {item.soLuongTon} {item.hangHoa.donViTinh}
                            </span>
                            {onAdjustStock && (
                              <button
                                type="button"
                                onClick={() => handleOpenAdjust(item as any)}
                                title="Điều chỉnh tồn kho ô này"
                                className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded border border-slate-200 transition-colors cursor-pointer"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-400">
                      Ô này hiện đang trống, chưa có mặt hàng nào
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nhấp vào một ô lưu trữ bất kỳ trên sơ đồ để xem thông tin chi tiết
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Inventory List Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hàng, mã hàng, hoặc vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Mã Hàng</th>
                  <th className="p-3.5">Tên Sản Phẩm</th>
                  <th className="p-3.5">Kho</th>
                  <th className="p-3.5">Vị Trí Ô</th>
                  <th className="p-3.5 text-center">Tồn Thực Tế (Sửa)</th>
                  <th className="p-3.5 text-center">Tạm Giữ</th>
                  <th className="p-3.5 text-center">Khả Dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Không tìm thấy bản ghi tồn kho nào
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-800">{item.hangHoa.maHH}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{item.hangHoa.tenHH}</div>
                        <div className="text-[11px] text-slate-500">{item.hangHoa.loaiHang?.tenLoai}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">{item.kho.tenKho}</td>
                      <td className="p-3.5">
                        <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 font-medium">
                          {item.viTri.maViTri}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {onAdjustStock ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(item)}
                            title="Bấm để điều chỉnh tồn kho ô này"
                            className="inline-flex items-center gap-1.5 font-bold text-sm px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer border border-slate-200"
                          >
                            <span>{item.soLuongTon}</span>
                            <SlidersHorizontal className="w-3 h-3 text-slate-400 group-hover:text-red-700" />
                          </button>
                        ) : (
                          <span className="font-bold text-slate-900 text-sm">{item.soLuongTon}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-medium text-amber-600">
                        {item.soLuongTamGiu}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-600 text-sm">
                        {item.soLuongKhaDung}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Điều Chỉnh Tồn Kho Trong Tab Kho */}
      {adjustItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAdjustItem(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Luôn cố định trên cùng) */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Điều Chỉnh Tồn Kho Thủ Công</h3>
                  <p className="text-[11px] text-red-100">Ô lưu trữ: {adjustItem.viTri?.maViTri}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustItem(null)}
                title="Đóng cửa sổ (Phím Esc)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-black/20 text-white font-bold transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body cuộn độc lập */}
            <form onSubmit={handleAdjustSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="font-bold text-slate-800 text-sm">
                    {adjustItem.hangHoa?.maHH} - {adjustItem.hangHoa?.tenHH}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-xs">
                    <div>Vị trí ô: <span className="font-semibold text-slate-800">{adjustItem.viTri?.maViTri}</span></div>
                    <div>Tồn hiện tại: <span className="font-bold text-red-700">{adjustItem.soLuongTon} {adjustItem.hangHoa?.donViTinh}</span></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Số Lượng Tồn Mới Tại Ô *</label>
                    {(() => {
                      const diff = adjustQty - adjustItem.soLuongTon;
                      if (diff > 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            <TrendingUp className="w-3 h-3" /> +{diff} (Tăng tồn)
                          </span>
                        );
                      }
                      if (diff < 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            <TrendingDown className="w-3 h-3" /> {diff} (Giảm tồn)
                          </span>
                        );
                      }
                      return <span className="text-[11px] text-slate-400 font-medium">Không đổi</span>;
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

                  {/* Capacity Error Banner */}
                  {(() => {
                    const targetSlot = locations.find((l) => l.id === adjustItem.viTriId);
                    if (!targetSlot) return null;
                    const otherItems = (targetSlot.tonKho || [])
                      .filter((tk) => tk.hangHoaId !== adjustItem.hangHoaId)
                      .reduce((sum, tk) => sum + tk.soLuongTon, 0);
                    const maxCap = Math.max(0, targetSlot.sucChua - otherItems);
                    if (adjustQty > maxCap) {
                      return (
                        <div className="mt-2 flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px] font-semibold animate-pulse">
                          <span>
                            ⚠️ Vượt quá hạn mức: Vị trí "{targetSlot.maViTri}" có sức chứa tối đa là {targetSlot.sucChua} sản phẩm{otherItems > 0 ? ` (đã chứa ${otherItems} sản phẩm khác)` : ''}. Không thể lưu trữ quá {maxCap} sản phẩm!
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">Lý Do Điều Chỉnh *</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {quickReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setAdjustReason(reason)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                          adjustReason === reason
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
                    placeholder="Ghi rõ lý do điều chỉnh..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer (Luôn cố định ở đáy) */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy Bỏ (Esc)
                </button>
                {(() => {
                  const targetSlot = locations.find((l) => l.id === adjustItem.viTriId);
                  const otherItems = (targetSlot?.tonKho || [])
                    .filter((tk) => tk.hangHoaId !== adjustItem.hangHoaId)
                    .reduce((sum, tk) => sum + tk.soLuongTon, 0);
                  const maxCap = targetSlot ? targetSlot.sucChua - otherItems : 999999;
                  const isOverCap = adjustQty > maxCap;

                  return (
                    <button
                      type="submit"
                      disabled={isAdjusting || isOverCap}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm transition-all cursor-pointer ${
                        isOverCap
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isAdjusting ? <span>Đang lưu...</span> : <><Check className="w-4 h-4" /><span>{isOverCap ? 'Vượt quá hạn mức ô' : 'Xác Nhận Cập Nhật Tồn'}</span></>}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
