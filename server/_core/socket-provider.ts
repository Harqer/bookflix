import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

/**
 * Enterprise UI Streamer (Netflix-Style Minimalist)
 * Informs the frontend of the current "Production Stage" without showing logs.
 */
export class SocketProvider {
  private static io: SocketServer | null = null;

  static initialize(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });
  }

  /**
   * Task: Update UI State (Aesthetic)
   * Instead of logs, this sends high-level "Stage Updates" for the mobile UI.
   */
  static updateStage(threadId: string, stage: 'reading' | 'scripting' | 'refining' | 'filming' | 'finished', progress: number) {
    if (!this.io) return;

    this.io.to(threadId).emit("studio_state", {
      stage,
      progress, // 0-100 for a smooth progress bar
      timestamp: Date.now()
    });
  }
}
