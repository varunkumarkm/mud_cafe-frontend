import { useEffect } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { getMyNotifications } from "../api/notificationApi";
import { useAuth } from "./useAuth";

export const useNotifications = () => {
    const { notifications, add, markRead, markAllRead, unreadCount } =
        useNotificationStore();
    const { isOwnerOrManager } = useAuth();

    useEffect(() => {
        if (!isOwnerOrManager) return;
        getMyNotifications()
            .then((res) => {
                res.data.forEach((n) => add(n));
            })
            .catch(() => { });
    }, []);

    return {
        notifications,
        markRead,
        markAllRead,
        unreadCount: unreadCount(),
    };
};