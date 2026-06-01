import { useState, useEffect, useCallback } from "react";

export function useUnreadMessages(token: string | null, baseUrl: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${baseUrl}/api/v1/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
    }
  }, [token, baseUrl]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return unreadCount;
}
