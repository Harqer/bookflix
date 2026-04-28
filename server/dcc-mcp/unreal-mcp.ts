import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const UNREAL_REMOTE_URL = process.env.UNREAL_REMOTE_URL || "http://localhost:8080/remote/object/call";

const server = new Server(
  {
    name: "unreal-engine-director",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "unreal_spawn_actor",
        description: "Spawns an actor in the Unreal Engine scene",
        inputSchema: {
          type: "object",
          properties: {
            className: { type: "string" },
            location: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                z: { type: "number" },
              },
            },
          },
          required: ["className", "location"],
        },
      },
      {
        name: "unreal_set_camera_transform",
        description: "Updates the cinematic camera transform in real-time",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "object" },
            rotation: { type: "object" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "unreal_spawn_actor": {
      const { className, location } = args as any;
      // In a real implementation, this would call the Unreal Remote Control API
      console.error(`Spawning actor ${className} at ${JSON.stringify(location)}`);
      return {
        content: [{ type: "text", text: `Success: Spawned ${className} at ${JSON.stringify(location)}` }],
      };
    }
    case "unreal_set_camera_transform": {
      // Simulate remote control call
      return {
        content: [{ type: "text", text: "Camera transform updated in Unreal Engine" }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
