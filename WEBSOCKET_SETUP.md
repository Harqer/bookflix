# BookCinema WebSocket Real-Time Updates Setup

This guide explains how to set up WebSocket connections for real-time production tracking instead of HTTP polling.

## Architecture Overview

**Current (HTTP Polling)**: Frontend polls `/api/job/:id` every 3-5 seconds
**Upgraded (WebSocket)**: Server pushes updates to connected clients in real-time

## Server Setup (Node.js + Socket.io)

### 1. Install Dependencies
```bash
pnpm add socket.io socket.io-client
```

### 2. Initialize WebSocket Server in `server/_core/index.ts`
```typescript
import { Server } from 'socket.io';
import http from 'http';

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Export io for use in other modules
export { io };

// Listen on port
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Create WebSocket Event Handlers in `server/websocket-handlers.ts`
```typescript
import { io } from './_core/index';
import { AutoOrchestrationEngine } from './auto-orchestration';

/**
 * Handle WebSocket connections
 */
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  /**
   * Join a book production room
   * Client emits: socket.emit('join-production', { bookId: 123 })
   */
  socket.on('join-production', (data: { bookId: number }) => {
    const room = `book-${data.bookId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
    
    // Notify others in the room
    io.to(room).emit('user-joined', { userId: socket.id });
  });

  /**
   * Start book orchestration
   * Client emits: socket.emit('start-orchestration', { bookId, bookContent, genre, ... })
   */
  socket.on('start-orchestration', async (data) => {
    const { bookId, bookContent, genre, productionStyle, tone } = data;
    const room = `book-${bookId}`;

    try {
      // Notify room that processing started
      io.to(room).emit('orchestration-started', {
        bookId,
        timestamp: new Date().toISOString()
      });

      // Create orchestration engine
      const engine = new AutoOrchestrationEngine({
        bookId,
        userId: socket.id,
        genre,
        productionStyle,
        tone
      });

      // Listen to progress updates
      const progressInterval = setInterval(() => {
        const progress = engine.getProgress();
        
        // Emit progress to all clients in the room
        io.to(room).emit('progress-update', {
          bookId,
          stage: progress.stage,
          progress: progress.progress,
          currentChapter: progress.currentChapter,
          totalChapters: progress.totalChapters,
          logs: progress.logs.slice(-5) // Last 5 logs
        });

        // Stop polling when complete
        if (progress.progress === 100) {
          clearInterval(progressInterval);
          io.to(room).emit('orchestration-complete', {
            bookId,
            timestamp: new Date().toISOString()
          });
        }
      }, 1000); // Update every second

      // Start orchestration
      await engine.orchestrateFullBook(bookContent);
    } catch (error) {
      io.to(room).emit('orchestration-error', {
        bookId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get current progress
   * Client emits: socket.emit('get-progress', { bookId: 123 })
   */
  socket.on('get-progress', async (data: { bookId: number }) => {
    const room = `book-${data.bookId}`;
    // Emit back to requesting client only
    socket.emit('progress-snapshot', {
      bookId: data.bookId,
      // Fetch from database or cache
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Leave production room
   */
  socket.on('leave-production', (data: { bookId: number }) => {
    const room = `book-${data.bookId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
```

## Frontend Setup (React Native + Socket.io Client)

### 1. Create WebSocket Hook in `hooks/use-orchestration-ws.ts`
```typescript
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface OrchestrationProgress {
  bookId: number;
  stage: string;
  progress: number;
  currentChapter: number;
  totalChapters: number;
  logs: string[];
}

export function useOrchestrationWebSocket(bookId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<OrchestrationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Handle connection
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join production room for this book
      newSocket.emit('join-production', { bookId });
    });

    // Handle progress updates
    newSocket.on('progress-update', (data: OrchestrationProgress) => {
      setProgress(data);
    });

    // Handle orchestration start
    newSocket.on('orchestration-started', (data) => {
      console.log('Orchestration started:', data);
      setError(null);
    });

    // Handle orchestration complete
    newSocket.on('orchestration-complete', (data) => {
      console.log('Orchestration complete:', data);
      setProgress(prev => prev ? { ...prev, progress: 100 } : null);
    });

    // Handle errors
    newSocket.on('orchestration-error', (data) => {
      console.error('Orchestration error:', data);
      setError(data.error);
    });

    // Handle disconnection
    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave-production', { bookId });
        newSocket.close();
      }
    };
  }, [bookId]);

  const startOrchestration = useCallback((
    bookContent: string,
    genre: string,
    productionStyle: 'cinematic' | 'animated' | 'documentary',
    tone: string
  ) => {
    if (socket) {
      socket.emit('start-orchestration', {
        bookId,
        bookContent,
        genre,
        productionStyle,
        tone
      });
    }
  }, [socket, bookId]);

  return {
    socket,
    progress,
    isConnected,
    error,
    startOrchestration
  };
}
```

### 2. Update Upload Screen to Use WebSocket
```typescript
// In app/(tabs)/upload-file.tsx

import { useOrchestrationWebSocket } from '@/hooks/use-orchestration-ws';

export default function UploadFileScreen() {
  const [bookId, setBookId] = useState<number | null>(null);
  const { progress, isConnected, error, startOrchestration } = useOrchestrationWebSocket(
    bookId || 0
  );

  const handleUploadAndProcess = async () => {
    if (!fileInputRef.current || !title) {
      Alert.alert('Error', 'Please select a file and enter a title');
      return;
    }

    try {
      // Upload file and get book ID
      const response = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData
      });
      const { bookId: newBookId } = await response.json();
      setBookId(newBookId);

      // Start orchestration via WebSocket
      startOrchestration(bookContent, genre, productionStyle, tone);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  return (
    <ScreenContainer>
      {/* ... existing UI ... */}
      
      {/* Real-time Progress Display */}
      {progress && (
        <View className="gap-2 mt-4">
          <View className="flex-row justify-between">
            <Text className="text-sm font-semibold">{progress.stage}</Text>
            <Text className="text-xs text-muted">{progress.progress}%</Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${progress.progress}%` }}
            />
          </View>
          <Text className="text-xs text-muted">
            Chapter {progress.currentChapter}/{progress.totalChapters}
          </Text>
          
          {/* Live Logs */}
          {progress.logs.length > 0 && (
            <View className="mt-2 p-2 bg-surface rounded">
              {progress.logs.map((log, i) => (
                <Text key={i} className="text-xs text-muted mb-1">
                  {log}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {error && (
        <View className="mt-4 p-3 bg-error/10 rounded">
          <Text className="text-sm text-error">{error}</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
```

## Environment Variables

Add to `.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
SOCKET_IO_PORT=3000
```

## Testing WebSocket Connection

### 1. Test with Socket.io Client
```bash
npm install -g socket.io-client-cli
socket.io-client-cli http://localhost:3000
```

### 2. Manual Test in Browser Console
```javascript
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected'));
socket.emit('join-production', { bookId: 1 });
socket.on('progress-update', (data) => console.log('Progress:', data));
```

## Production Deployment

### Railway Deployment
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm start"
```

### Environment Variables on Railway
- `REDIS_URL`: Redis connection string
- `DATABASE_URL`: PlanetScale connection string
- `NODE_ENV`: production

## Performance Optimization

1. **Batch Updates**: Emit progress every 1-2 seconds, not every change
2. **Compression**: Use Socket.io compression for large payloads
3. **Rooms**: Use Socket.io rooms to isolate book productions
4. **Scaling**: Use Redis adapter for multi-server deployments

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket connection fails | Check CORS settings, ensure server is running on correct port |
| Progress updates lag | Reduce update frequency, check network latency |
| Memory leak on disconnect | Ensure socket.close() is called in cleanup |
| Reconnection loops | Check reconnection settings, verify server health |

## References

- Socket.io Docs: https://socket.io/docs/
- Socket.io React Native: https://socket.io/docs/v4/socket-io-client-api/
- Real-time Best Practices: https://socket.io/docs/v4/best-practices/
