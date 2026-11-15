import React from 'react';
import { ClipboardList, Shield, User as UserIcon } from 'lucide-react';

interface AuditsViewProps {
  audits: any[];
}

export const AuditsView: React.FC<AuditsViewProps> = ({ audits }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Nhật Ký Kiểm Toán Hệ Thống</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Thời Gian</th>
                <th className="p-3.5">Người Thực Hiện</th>
                <th className="p-3.5">Hành Động</th>
                <th className="p-3.5">Đối Tượng</th>
                <th className="p-3.5">Nội Dung Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Chưa có nhật ký nào được ghi nhận
                  </td>
                </tr>
              ) : (
                audits.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.thoiGian).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.nguoiDung?.hoTen || 'Hệ thống'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">@{log.nguoiDung?.username || 'system'}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-800 font-mono px-2 py-0.5 rounded font-semibold text-[11px]">
                        {log.loaiThaoTac}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">{log.doiTuong}</td>
                    <td className="p-3.5 text-slate-800 max-w-md">{log.noiDung}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

