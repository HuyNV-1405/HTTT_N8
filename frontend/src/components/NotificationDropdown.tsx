import React from 'react';
import { NotificationItem } from '../types';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
  FileText,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  readIds: string[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: NotificationItem) => void;
  alertCount: number;
  onViewAlerts: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  readIds,
  onMarkAllAsRead,
  onSelectNotification,
  alertCount,
  onViewAlerts,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.toLocaleDateString('vi-VN')}`;
    } catch {
      return '';
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DISPATCH_APPROVED':
      case 'RECEIPT_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'DISPATCH_REJECTED':
      case 'RECEIPT_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
      case 'DISPATCH_PENDING':
      case 'RECEIPT_PENDING':
      default:
        return <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    }
  };

  const getBadgeStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DISPATCH_APPROVED':
      case 'RECEIPT_APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISPATCH_REJECTED':
      case 'RECEIPT_REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Card */}
      <div className="absolute right-0 top-full mt-2 w-96 sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Trung Tâm Thông Báo</h3>
              <p className="text-[11px] text-red-100">
                {unreadCount > 0 ? `${unreadCount} thông báo mới chưa đọc` : 'Không có thông báo mới'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] bg-white/20 hover:bg-white/30 text-white font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đã đọc</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/10 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto divide-y divide-slate-100 flex-1 text-xs">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <div className="font-medium text-slate-600">Chưa có thông báo nào</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Các sự kiện duyệt phiếu, từ chối phiếu xuất/nhập sẽ hiển thị tại đây.
              </div>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = readIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectNotification(item);
                    onClose();
                  }}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 relative hover:bg-slate-50 ${
                    !isRead ? 'bg-red-50/40' : 'bg-white'
                  }`}
                >
                  {/* Left Icon */}
                  {getIcon(item.type)}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-800 truncate text-[12px]">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-[11px] line-clamp-2">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeStyle(
                          item.type
                        )}`}
                      >
                        <FileText className="w-3 h-3" />
                        {item.targetCode}
                      </span>

                      <span className="text-[11px] text-red-600 font-semibold flex items-center gap-0.5 hover:underline">
                        <span>Xem phiếu</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Unread indicator dot */}
                  {!isRead && (
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 self-start mt-1.5 ring-2 ring-white" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Quick Link to Stock Alerts */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Cảnh báo tồn kho:</span>
            <span className="font-bold text-slate-800">{alertCount}</span>
          </div>
          <button
            onClick={() => {
              onViewAlerts();
              onClose();
            }}
            className="text-red-600 font-semibold hover:underline text-[11px] cursor-pointer"
          >
            Mở mục cảnh báo &rarr;
          </button>
        </div>
      </div>
    </>
  );
};
