import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { useTableStore } from "../store/tableStore";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

export const useWebSocket = () => {
  const updateStatus = useTableStore((s) => s.updateStatus);
  const addNotification = useNotificationStore((s) => s.add);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      brokerURL: `ws://localhost:8080/ws/websocket`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ WebSocket connected");

        // Subscribe to table status updates
        client.subscribe("/topic/tables", (msg) => {
          try {
            const data = JSON.parse(msg.body);
            updateStatus(data.tableId, data.status);
          } catch {}
        });

        // Subscribe to payment notifications
        client.subscribe("/topic/payments", (msg) => {
          try {
            const data = JSON.parse(msg.body);
            addNotification({
              id: data.billId + "_" + Date.now(),
              message: `Table ${data.tableNumber} paid ₹${data.total} via ${data.paymentMethod}`,
              type: "PAYMENT",
              read: false,
              sentAt: data.timestamp,
              billId: data.billId,
            });
          } catch {}
        });
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
      },
      onStompError: (frame) => {
        console.error("WebSocket error:", frame);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [token]);
};