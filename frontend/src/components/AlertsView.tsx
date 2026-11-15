import React, { useState } from 'react';
import { CanhBao } from '../types';
import { AlertTriangle, CheckCircle, Clock, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface AlertsViewProps {
  alerts: CanhBao[];
  onResolveAlert: (id: string) => Promise<void>;
  onNavigateToReceipt: () => void;
  canManage: boolean;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onResolveAlert,
  onNavigateToReceipt,
  canManage,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CHUA_XU_LY' | 'DA_XU_LY'>('CHUA_XU_LY');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.trangThai === filter;
  });

  const handleResolve = async (id: string) => {
    setLoadingId(id);
    try {
      await onResolveAlert(id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi xử lý cảnh báo');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Cảnh Báo Tồn Kho Tự Động</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilter('CHUA_XU_LY')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filter === 'CHUA_XU_LY' ? 'bg-white text-red-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Chưa Xử Lý ({alerts.filter((a) => a.trangThai === 'CHUA_XU_LY').length})
          </button>
          <button
            onClick={() => setFilter('DA_XU_LY')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filter === 'DA_XU_LY' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Đã Xử Lý ({alerts.filter((a) => a.trangThai === 'DA_XU_LY').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${filter === 'ALL' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Tất Cả ({alerts.length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            Không có cảnh báo tồn kho nào cần xử lý
          </div>
        ) : (
          filteredAlerts.map((a) => {
            const isUnresolved = a.trangThai === 'CHUA_XU_LY';
            const isOutOfStock = a.loaiCanhBao === 'HET_HANG';

            return (
              <div
                key={a.id}
                className={`bg-white p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isUnresolved
                  ? 'border-rose-200 shadow-sm hover:border-rose-300'
                  : 'border-slate-200 opacity-75'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${isOutOfStock ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{a.hangHoa?.tenHH}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {isOutOfStock ? 'HẾT HÀNG' : 'DƯỚI ĐỊNH MỨC TỐI THIỂU'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{a.noiDung}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
                      <span>Kho: <strong className="text-slate-700">{a.kho?.tenKho}</strong></span>
                      <span>Tồn hiện tại: <strong className="text-rose-600">{a.mucTonHienTai}</strong></span>
                      <span>Định mức tối thiểu: <strong className="text-slate-700">{a.mucTonToiThieu}</strong></span>
                      <span>Ngày tạo: {new Date(a.ngayTao).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onNavigateToReceipt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Lập Phiếu Nhập</span>
                  </button>

                  {isUnresolved && canManage && (
                    <button
                      onClick={() => handleResolve(a.id)}
                      disabled={loadingId === a.id}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                    >
                      {loadingId === a.id ? 'Đang cập nhật...' : 'Đã Xử Lý'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

