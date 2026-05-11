import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, TrendingDown, Info, CheckCheck } from 'lucide-react';
import type { AppNotification, NotificationType } from '@propsphere/types';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/api/notifications';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  new_listing: <Home className="w-4 h-4 text-brand-primary" />,
  price_drop: <TrendingDown className="w-4 h-4 text-brand-secondary" />,
  inspection: <Bell className="w-4 h-4 text-brand-accent" />,
  system: <Info className="w-4 h-4 text-neutral-400" />,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string, url?: string) => void;
}) {
  const url = notification.data['url'];
  return (
    <button
      type="button"
      onClick={() => onRead(notification.id, url)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${
        !notification.is_read ? 'bg-brand-primary/5' : ''
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        {TYPE_ICON[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 leading-snug">{notification.title}</p>
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-neutral-400 mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}

export function NotificationCentre() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayCount = unreadCount > 9 ? '9+' : String(unreadCount);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleRead(id: string, url?: string) {
    markRead(id);
    setOpen(false);
    if (url) navigate(url);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-btn text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-card shadow-modal border border-neutral-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-sm font-semibold text-neutral-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary-dark disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
