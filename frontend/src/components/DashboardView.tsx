import React from 'react';
import { DashboardStats, Role } from '../types';
import {
  Package,
  Warehouse,
  Coins,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ClipboardList,
  CheckSquare,
  ArrowLeftRight,
  Layers,
  ShieldAlert
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigate: (tab: string) => void;
  userRole?: Role;
  userName?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNavigate,
  userRole,
  userName,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
        Đang tải dữ liệu thống kê tổng quan...
      </div>
    );
  }

  const { overview, alerts, recentTransactions } = stats;
  const isWarehouseStaff = userRole === 'NHAN_VIEN_KHO';

  // ==========================================
  // GIAO DIỆN DÀNH CHO NHÂN VIÊN KHO (TÁC NGHIỆP HIỆN TRƯỜNG)
  // ==========================================
  if (isWarehouseStaff) {
    return (
      <div className="space-y-6">
        {/* Banner Chào & Phím tắt tác nghiệp kho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-6 rounded-2xl text-white shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-2">
              <Warehouse className="w-3.5 h-3.5" /> Bàn Làm Việc Tác Nghiệp Kho Hiện Trường
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Xin chào, {userName || 'Nhân viên kho'}!
            </h2>
            <p className="text-red-100 text-xs mt-1">
              Chúc bạn một ca làm việc an toàn, sắp xếp gọn gàng và soạn hàng chính xác.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Warehouse className="w-4 h-4 text-red-600" />
              <span>Sơ Đồ Kệ Hàng</span>
            </button>
            <button
              onClick={() => onNavigate('transfers')}
              className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Chuyển Vị Trí</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ Nhiệm Vụ Tác Nghiệp Kho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nhiệm vụ 1: Nhập kho chờ xếp kệ */}
          <div
            onClick={() => onNavigate('receipts')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-red-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Phiếu Nhập Chờ Xử Lý
                </div>
                <div className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-red-600">
                  {overview.pendingReceipts}
                </div>
                <div className="text-xs text-red-600 font-medium mt-1">Kiểm đếm & xếp vào ô kệ &rarr;</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Nhiệm vụ 2: Xuất kho cần soạn hàng */}
          <div
            onClick={() => onNavigate('dispatches')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Phiếu Xuất Cần Soạn Hàng
                </div>
                <div className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-amber-600">
                  {overview.pendingDispatches}
                </div>
                <div className="text-xs text-amber-600 font-medium mt-1">Lấy hàng từ tọa độ kệ &rarr;</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Nhiệm vụ 3: Cảnh báo cần kiểm kê */}
          <div
            onClick={() => onNavigate('alerts')}
            className={`p-5 rounded-xl border shadow-sm transition-all cursor-pointer group ${
              overview.alertCount > 0 ? 'bg-red-50/50 border-red-200 hover:border-red-400' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Hàng Cần Kiểm Kê
                </div>
                <div className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-red-600">
                  {overview.alertCount}
                </div>
                <div className="text-xs text-red-600 font-medium mt-1">
                  {overview.alertCount > 0 ? 'Kiểm tra hàng tồn thực tế &rarr;' : 'Tồn an toàn'}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                overview.alertCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Nhiệm vụ 4: Mặt hàng đang lưu trữ */}
          <div
            onClick={() => onNavigate('inventory')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tổng Tồn Đang Lưu Kệ
                </div>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {overview.totalStockQty.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">{overview.totalProducts} mặt hàng &rarr;</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Hướng dẫn Quy trình Tác nghiệp Chuẩn Kho (SOP) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 font-bold text-slate-800 text-sm">
            <ClipboardList className="w-4 h-4 text-red-600" />
            <span>Quy Trình Tác Nghiệp Chuẩn Tại Kho (SOP)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]">
                1
              </div>
              <h5 className="font-bold text-slate-800">Tiếp nhận & Kiểm đếm</h5>
              <p className="text-slate-500 leading-relaxed">
                Đối chiếu số lượng thực tế với Phiếu Nhập và hóa đơn nhà cung cấp trước khi xếp hàng.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]">
                2
              </div>
              <h5 className="font-bold text-slate-800">Xếp Kệ Theo Tọa Độ</h5>
              <p className="text-slate-500 leading-relaxed">
                Đưa hàng vào đúng Khu vực - Kệ - Tầng - Ô đã quy định trên sơ đồ kho để tránh thất lạc.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]">
                3
              </div>
              <h5 className="font-bold text-slate-800">Soạn Hàng (Picking)</h5>
              <p className="text-slate-500 leading-relaxed">
                Lấy chính xác số lượng từ ô vị trí chỉ định trên Phiếu Xuất, kiểm tra nguyên vẹn bao bì.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]">
                4
              </div>
              <h5 className="font-bold text-slate-800">Báo Cáo Bất Thường</h5>
              <p className="text-slate-500 leading-relaxed">
                Nếu phát hiện chênh lệch, hư hỏng hoặc ô kệ bị đầy, báo ngay Quản lý kho để điều chuyển.
              </p>
            </div>
          </div>
        </div>

        {/* Danh sách tác nghiệp: Phiếu Nhập & Phiếu Xuất Cần Thao Tác */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phiếu Nhập */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <ArrowDownLeft className="w-4 h-4 text-red-600" />
                <span>Phiếu Nhập Chờ Kiểm Đếm & Xếp Kệ</span>
              </div>
              <button
                onClick={() => onNavigate('receipts')}
                className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Mở danh sách
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {recentTransactions.receipts.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Không có phiếu nhập nào cần xử lý</div>
              ) : (
                recentTransactions.receipts.slice(0, 4).map((r) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-800">{r.maPN}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{r.nhaCungCap?.tenNCC}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        r.trangThai === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-600'
                          : r.trangThai === 'REJECTED'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {r.trangThai === 'APPROVED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Đã duyệt - Sẵn sàng
                          </>
                        ) : r.trangThai === 'REJECTED' ? (
                          <>
                            <XCircle className="w-3 h-3" /> Từ chối
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Chờ duyệt
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Phiếu Xuất */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
                <span>Phiếu Xuất Cần Soạn Hàng Ra Cửa Xuất</span>
              </div>
              <button
                onClick={() => onNavigate('dispatches')}
                className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Mở danh sách
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {recentTransactions.dispatches.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Không có phiếu xuất nào cần xử lý</div>
              ) : (
                recentTransactions.dispatches.slice(0, 4).map((d) => (
                  <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-800">{d.maPX}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{d.khachHang?.tenKH}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        d.trangThai === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-600'
                          : d.trangThai === 'REJECTED'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {d.trangThai === 'APPROVED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Đã duyệt - Lấy hàng
                          </>
                        ) : d.trangThai === 'REJECTED' ? (
                          <>
                            <XCircle className="w-3 h-3" /> Từ chối
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Chờ duyệt
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN DÀNH CHO ADMIN & QUẢN LÝ KHO (QUẢN LÝ VĨ MÔ & PHÊ DUYỆT)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> Bảng Điều Khiển Quản Lý & Điều Hành
          </div>
          <h2 className="text-xl font-bold tracking-tight">Hệ Thống Quản Lý Kho Hàng Tập Trung</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('receipts')}
            className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-red-600" />
            <span>Lập Phiếu Nhập</span>
          </button>
          <button
            onClick={() => onNavigate('dispatches')}
            className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Lập Phiếu Xuất</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng Mặt Hàng</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{overview.totalProducts}</div>
            <div className="text-xs text-slate-400 mt-1">Đang kinh doanh</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng Tồn Kho</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{overview.totalStockQty.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">Sản phẩm thực tế</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Quản lý vốn hàng tồn */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Giá Trị Tồn Kho</div>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {(overview.totalStockValue / 1_000_000).toFixed(1)} tr VND
            </div>
            <div className="text-xs text-slate-400 mt-1">Theo giá vốn nhập kho</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('alerts')}
          className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${overview.alertCount > 0
            ? 'bg-red-50 border-red-200 hover:border-red-300'
            : 'bg-white border-slate-200'
            }`}
        >
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cảnh Báo Tồn Kho</div>
            <div className={`text-2xl font-bold mt-1 ${overview.alertCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {overview.alertCount}
            </div>
            <div className="text-xs text-red-500 font-medium mt-1">
              {overview.alertCount > 0 ? 'Cần nhập hàng gấp' : 'Mức tồn an toàn'}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overview.alertCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
            }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Approvals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Phiếu Nhập Chờ Duyệt</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {overview.pendingReceipts} phiếu cần quản lý kho duyệt để tự động cộng tồn
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('receipts')}
            className="text-xs bg-white text-red-700 font-semibold px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Xem phiếu &rarr;
          </button>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600 text-white rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Phiếu Xuất Chờ Duyệt</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {overview.pendingDispatches} phiếu đang tạm giữ tồn, chờ duyệt trừ kho
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('dispatches')}
            className="text-xs bg-white text-amber-700 font-semibold px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Xem phiếu &rarr;
          </button>
        </div>
      </div>

      {/* Active Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Cảnh Báo Tồn Kho Cần Xử Lý ({alerts.length})</span>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-red-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 2).map((a) => (
              <div key={a.id} className="bg-white p-3 rounded-lg border border-red-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{a.hangHoa?.tenHH}</span>
                  <span className="text-slate-500 mx-1.5">|</span>
                  <span className="text-red-600 font-medium">Tồn hiện tại: {a.mucTonHienTai} (Tối thiểu: {a.mucTonToiThieu})</span>
                </div>
                <span className="text-slate-500">{a.kho?.tenKho}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions Split: Receipts & Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Receipts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <ArrowDownLeft className="w-4 h-4 text-red-600" />
              <span>Phiếu Nhập Gần Đây</span>
            </div>
            <button
              onClick={() => onNavigate('receipts')}
              className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {recentTransactions.receipts.length === 0 ? (
              <div className="p-6 text-center text-slate-400">Chưa có giao dịch nhập nào</div>
            ) : (
              recentTransactions.receipts.map((r) => (
                <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{r.maPN}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{r.nhaCungCap?.tenNCC}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      {Number(r.tongTien).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="mt-0.5">
                      {r.trangThai === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Đã ghi sổ
                        </span>
                      ) : r.trangThai === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <ArrowUpRight className="w-4 h-4 text-red-600" />
              <span>Phiếu Xuất Gần Đây</span>
            </div>
            <button
              onClick={() => onNavigate('dispatches')}
              className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {recentTransactions.dispatches.length === 0 ? (
              <div className="p-6 text-center text-slate-400">Chưa có giao dịch xuất nào</div>
            ) : (
              recentTransactions.dispatches.map((d) => (
                <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{d.maPX}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{d.khachHang?.tenKH}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      {Number(d.tongTien).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="mt-0.5">
                      {d.trangThai === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Đã trừ kho
                        </span>
                      ) : d.trangThai === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
