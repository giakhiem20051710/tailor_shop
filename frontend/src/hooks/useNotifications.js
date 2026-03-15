import { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import notificationService from "../services/notificationService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8083/api/v1";
// WebSocket URL: derive from API base (strip /api/v1 suffix)
const WS_URL = API_BASE.replace(/\/api\/v1\/?$/, "") + "/ws";

/**
 * Custom hook for real-time notifications via WebSocket (STOMP + SockJS).
 * Falls back to REST API polling if WebSocket is unavailable.
 * 
 * Usage:
 *   const { notifications, unreadCount, markAsRead, markAllAsRead, connected } = useNotifications();
 */
export default function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    // Load initial notifications from REST API
    const loadNotifications = useCallback(async () => {
        try {
            const res = await notificationService.list(0, 20);
            const data = res?.responseData || res?.data || res || {};
            const content = data?.content || [];
            setNotifications(content);
        } catch {
            /* silent */
        }
    }, []);

    // Load unread count
    const loadUnreadCount = useCallback(async () => {
        try {
            const res = await notificationService.getUnreadCount();
            const data = res?.responseData || res?.data || res || {};
            setUnreadCount(data?.count || 0);
        } catch {
            /* silent */
        }
    }, []);

    // Mark as read
    const markAsRead = useCallback(async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            /* silent */
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            /* silent */
        }
    }, []);

    // Connect WebSocket
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userData = JSON.parse(localStorage.getItem("userData") || "null");
        const userId = userData?.id;
        if (!userId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (str) => {
                if (import.meta.env.DEV) {
                    console.log("[WS]", str);
                }
            },
            onConnect: () => {
                setConnected(true);

                // Subscribe to user-specific channel
                client.subscribe(`/user/${userId}/queue/notifications`, (message) => {
                    try {
                        const notif = JSON.parse(message.body);
                        setNotifications((prev) => [notif, ...prev].slice(0, 50));
                        setUnreadCount((prev) => prev + 1);
                    } catch {
                        /* ignore parse errors */
                    }
                });

                // Subscribe to broadcast channel
                client.subscribe("/topic/notifications", (message) => {
                    try {
                        const notif = JSON.parse(message.body);
                        setNotifications((prev) => [notif, ...prev].slice(0, 50));
                        setUnreadCount((prev) => prev + 1);
                    } catch {
                        /* ignore parse errors */
                    }
                });
            },
            onDisconnect: () => {
                setConnected(false);
            },
            onStompError: (frame) => {
                console.warn("[WS] STOMP error:", frame.headers?.message);
                setConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        // Initial load from REST API
        loadNotifications();
        loadUnreadCount();

        // Fallback polling every 2 minutes
        const pollInterval = setInterval(() => {
            if (!client.connected) {
                loadNotifications();
                loadUnreadCount();
            }
        }, 120000);

        return () => {
            clearInterval(pollInterval);
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (client.connected) {
                client.deactivate();
            }
        };
    }, [loadNotifications, loadUnreadCount]);

    return {
        notifications,
        unreadCount,
        connected,
        markAsRead,
        markAllAsRead,
        refresh: () => { loadNotifications(); loadUnreadCount(); },
    };
}
