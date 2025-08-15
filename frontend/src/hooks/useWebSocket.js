import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (onNewLog) => {
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 WebSocket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
      });

      socketRef.current.on('newLog', (data) => {
        console.log('📝 New log received via WebSocket:', data);
        if (onNewLog && typeof onNewLog === 'function') {
          onNewLog(data);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
      });
    }
  }, [onNewLog]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    emit,
    connect,
    disconnect
  };
};

export default useWebSocket; 