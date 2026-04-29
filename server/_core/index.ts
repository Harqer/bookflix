import express from "express";
import { createServer } from "http";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { enterpriseMiddleware } from "./enterprise-middleware";
import studioRouter from "../api/studio";
import { SocketProvider } from "./socket-provider";

/**
 * Enterprise Studio Server (Invisible Atomic Design)
 * Aligned with FastAPI best practices for modularity and real-time streaming.
 */
async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 3001;

  // 1. Layer: Global Middlewares (Atomic)
  app.use(cors());
  app.use(express.json());
  app.use(clerkMiddleware());
  app.use(enterpriseMiddleware);

  // 2. Layer: Real-time Infrastructure (Atomic)
  // Initializes the Cinematic Feed (WebSocket)
  SocketProvider.initialize(httpServer);
  
  // 3. Layer: Modular Routing (FastAPI sub-applications pattern)
  app.use("/api/studio", studioRouter);

  // Health Check (Atomic)
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", websocket: "active", timestamp: new Date().toISOString() });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Studio Server ready at http://localhost:${PORT}`);
    console.log(`📡 WebSocket Feed: ws://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);
