import React from 'react';
import { DashboardStats } from '../types';
import {
  Package,
  Warehouse,
  Coins,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onNavigate }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
        Đang tải dữ liệu thống kê tổng quan...
      </div>
    );
  }

  const { overview, alerts, recentTransactions } = stats;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-6 rounded-2xl text-white shadow-md">
        <div>
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

      {/* 6 Core KPI Metric Cards */}
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

        {/* Metric 3 */}
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
          className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            overview.alertCount > 0
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            overview.alertCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
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
              <AlertTriangle className="w-4 h-4 text-red-600" />
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

