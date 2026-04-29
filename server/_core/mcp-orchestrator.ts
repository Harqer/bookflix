import { Client } from "@modelcontextprotocol/sdk/client/index";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse";
import * as path from "node:path";

/**
 * Enterprise MCP Orchestrator (Invisible Atomic Refactor)
 * Hardened for Static Analysis and 2026 Production Environments.
 */
export class MCPOrchestrator {
  private static clients: Map<string, Client> = new Map();

  /**
   * Task: Transport Factory (Atomic)
   */
  private static createTransport(serverName: string) {
    const serverPath = path.join(process.cwd(), "server", "dcc-mcp");

    if (serverName.startsWith("remote-")) {
      return this.createRemoteTransport(serverName);
    }

    return new StdioClientTransport({
      command: "python3",
      args: [path.join(serverPath, `${serverName}-mcp.py`)],
    });
  }

  /**
   * Task: Remote Transport Factory (Spec-Compliant SSE)
   * Uses Query Parameter authentication to satisfy strict SSE type checks.
   */
  private static createRemoteTransport(serverName: string) {
    const remoteUrl = this.getStaticEnvUrl(serverName);
    if (!remoteUrl) {
      throw new Error(`[MCP] Remote URL missing for ${serverName}.`);
    }

    // 2026 Standard: Pass auth via query params for SSE/WebSockets
    // to bypass the native EventSource header limitation.
    const urlWithAuth = new URL(remoteUrl);
    const token = process.env.LANGCHAIN_V2_AUTH_TOKEN;
    if (token) {
      urlWithAuth.searchParams.set("token", token);
    }
    
    // X-Agent-Connection-Id can also be passed via URL for auditing
    urlWithAuth.searchParams.set("cid", "bookcinema-studio-v2");

    return new SSEClientTransport(urlWithAuth);
  }

  /**
   * Task: Static Env Registry (Atomic)
   */
  private static getStaticEnvUrl(serverName: string): string | undefined {
    switch (serverName) {
      case "remote-render":
        return process.env.MCP_URL_REMOTE_RENDER;
      case "remote-blender":
        return process.env.MCP_URL_REMOTE_BLENDER;
      case "remote-nuke":
        return process.env.MCP_URL_REMOTE_NUKE;
      case "cosmos":
      case "maya":
      case "houdini":
      case "comfyui":
      case "unreal":
      case "unity":
      case "resolve":
        return "local"; // Markers for local stdio transport
      default:
        return undefined;
    }
  }

  /**
   * Task: Security Auditor (Atomic)
   */
  private static auditArguments(args: any) {
    const forbidden = [/os\./i, /subprocess/i, /eval\(/i, /exec\(/i, /__import__/i];
    const check = (val: any) => {
      if (typeof val === 'string') {
        if (forbidden.some(p => p.test(val))) {
          throw new Error(`[Security] Malicious pattern detected in MCP arguments`);
        }
      } else if (typeof val === 'object' && val !== null) {
        Object.values(val).forEach(check);
      }
    };
    check(args);
  }

  /**
   * Composable: Connection Management
   */
  static async getClient(serverName: string): Promise<Client> {
    const existing = this.clients.get(serverName);
    if (existing) return existing;

    const client = new Client(
      { name: "bookcinema-orchestrator", version: "1.0.0" },
      { capabilities: {} }
    );

    try {
      const transport = this.createTransport(serverName);
      await client.connect(transport);
      this.clients.set(serverName, client);
      return client;
    } catch (error) {
      console.error(`[MCP] Failed to connect to ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Orchestrate: Tool Execution
   */
  static async callTool(serverName: string, toolName: string, args: any) {
    this.auditArguments(args);
    
    try {
      const client = await this.getClient(serverName);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      return {
        success: !result.isError,
        output: result.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
}
