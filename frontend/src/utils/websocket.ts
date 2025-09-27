import { io, Socket } from "socket.io-client";

export interface OptionUpdate {
  instrument: string;
  data: {
    instrument_name: string;
    heston_price: number;
    strike_price: number;
    expiration_date: number;
    option_type: "call" | "put";
    timestamp: string;
  };
}

export interface OptionHistory {
  instrument: string;
  data: Array<{
    instrument_name: string;
    heston_price: number;
    strike_price: number;
    expiration_date: number;
    option_type: "call" | "put";
    timestamp: string;
  }>;
}

export interface WebSocketEventHandlers {
  onUpdate?: (update: OptionUpdate) => void;
  onHistory?: (history: OptionHistory) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions = new Set<string>();
  private eventHandlers: WebSocketEventHandlers = {};

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io("http://localhost:5080", {
      transports: ["websocket", "polling"],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
      this.eventHandlers.onConnect?.();

      // Resubscribe to all instruments after reconnection
      this.subscriptions.forEach((instrument) => {
        this.socket?.emit("subscribe", { instrument });
      });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      this.eventHandlers.onDisconnect?.();
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔌 WebSocket connection error:", error);
      this.eventHandlers.onError?.(error);
    });

    this.socket.on("error", (error) => {
      console.error("⚠️ WebSocket error:", error);
      this.eventHandlers.onError?.(error);
    });

    this.socket.on("history", (data: OptionHistory) => {
      console.log(
        "📈 Received history for:",
        data.instrument,
        data.data.length,
        "points"
      );
      this.eventHandlers.onHistory?.(data);
    });

    this.socket.on("update", (data: OptionUpdate) => {
      console.log("🔄 Received update for:", data.instrument);
      this.eventHandlers.onUpdate?.(data);
    });
  }

  public setEventHandlers(handlers: WebSocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  public subscribe(instrument: string) {
    if (!instrument) return;

    this.subscriptions.add(instrument);

    if (this.socket?.connected) {
      console.log("🔔 Subscribing to:", instrument);
      this.socket.emit("subscribe", { instrument });
    } else {
      console.log(
        "⏳ WebSocket not connected, queuing subscription for:",
        instrument
      );
    }
  }

  public unsubscribe(instrument: string) {
    if (!instrument) return;

    this.subscriptions.delete(instrument);

    if (this.socket?.connected) {
      console.log("🔕 Unsubscribing from:", instrument);
      this.socket.emit("unsubscribe", { instrument });
    }
  }

  public disconnect() {
    this.subscriptions.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
};

export const disconnectWebSocket = () => {
  if (wsManager) {
    wsManager.disconnect();
    wsManager = null;
  }
};
