"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { getSocket } from "@/lib/socket";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") ?? "";
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* silent — bell just stays as-is until next poll */
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Real-time push over the socket.
    let socket: ReturnType<typeof getSocket> | null = null;
    try {
      socket = getSocket();
      socket.on("notification:new", (notif: Notification) => {
        setNotifications((prev) => [notif, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
      });
    } catch {
      /* not logged in yet */
    }

    // Fallback poll every 30s in case the socket connection drops.
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      socket?.off("notification:new");
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    const token = getToken();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* silent */
    }
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={600}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              You&apos;re all caught up.
            </Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <Box
              key={n.id}
              sx={{
                px: 2,
                py: 1.25,
                borderBottom: "1px solid #F1F5F9",
                bgcolor: n.read ? "transparent" : "#EFF6FF",
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {n.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {n.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {relativeTime(n.createdAt)}
              </Typography>
            </Box>
          ))
        )}
      </Menu>
    </>
  );
}
