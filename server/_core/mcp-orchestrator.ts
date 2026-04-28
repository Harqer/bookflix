import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

/**
 * MCP Orchestrator
 * Connects the AI Director to specialized DCC tools (Blender, Nuke, Unreal)
 * following Vercel's Agentic Infrastructure best practices.
 */
export class MCPOrchestrator {
  private static clients: Map<string, Client> = new Map();

  static async getClient(serverName: string): Promise<Client> {
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    const client = new Client(
      {
        name: "bookcinema-orchestrator",
        version: "1.0.0",
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
      }
    );

    let transport;
    const serverPath = path.join(process.cwd(), "server", "dcc-mcp");

    if (serverName === "blender") {
      transport = new StdioClientTransport({
        command: "python3",
        args: [path.join(serverPath, "blender-mcp.py")],
      });
    } else if (serverName === "nuke") {
      transport = new StdioClientTransport({
        command: "python3",
        args: [path.join(serverPath, "nuke-comfy-mcp.py")],
      });
    } else if (serverName === "houdini") {
      transport = new StdioClientTransport({
        command: "python3",
        args: [path.join(serverPath, "houdini-mcp.py")],
      });
    } else {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    await client.connect(transport);
    this.clients.set(serverName, client);
    return client;
  }

  static async callTool(serverName: string, toolName: string, args: any) {
    console.log(`[MCP] Calling ${serverName}.${toolName}...`);
    
    // Cybersecurity: Simple Input Sanitization
    const sanitizedArgs = JSON.parse(JSON.stringify(args));
    const forbiddenPatterns = [/os\./i, /subprocess/i, /eval\(/i, /exec\(/i, /__import__/i];
    
    const checkValue = (val: any) => {
      if (typeof val === 'string') {
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(val)) throw new Error(`[Security] Malicious pattern detected in MCP arguments: ${pattern}`);
        }
      } else if (typeof val === 'object' && val !== null) {
        Object.values(val).forEach(checkValue);
      }
    };
    checkValue(sanitizedArgs);

    try {
      const client = await this.getClient(serverName);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      // Following Vercel Academy: check for tool output and return structured feedback
      return {
        success: !result.isError,
        output: result.content,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[MCP] Failed to call ${serverName}.${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async disconnectAll() {
    for (const client of this.clients.values()) {
      // Clean up transport
    }
    this.clients.clear();
  }
}
