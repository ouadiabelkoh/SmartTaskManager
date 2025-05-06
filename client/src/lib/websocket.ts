let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let eventHandlers: Record<string, ((data: any) => void)[]> = {};

export function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connected");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
  
  socket.onclose = () => {
    console.log("WebSocket disconnected, attempting to reconnect...");
    socket = null;
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type && eventHandlers[message.type]) {
        eventHandlers[message.type].forEach(handler => handler(message.data));
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
}

export function sendMessage(type: string, data: any = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not connected, unable to send message");
    return false;
  }
  
  socket.send(JSON.stringify({ type, data }));
  return true;
}

export function on(eventType: string, callback: (data: any) => void) {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = [];
  }
  eventHandlers[eventType].push(callback);
  
  return () => {
    eventHandlers[eventType] = eventHandlers[eventType].filter(handler => handler !== callback);
  };
}

export function off(eventType: string, callback?: (data: any) => void) {
  if (!callback) {
    eventHandlers[eventType] = [];
    return;
  }
  
  if (eventHandlers[eventType]) {
    eventHandlers[eventType] = eventHandlers[eventType].filter(handler => handler !== callback);
  }
}

export function isConnected() {
  return socket?.readyState === WebSocket.OPEN;
}

export function closeConnection() {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  eventHandlers = {};
}
