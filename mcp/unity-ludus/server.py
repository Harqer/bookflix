import asyncio
from mcp.server.fastmcp import FastMCP
import httpx
import os

# 🎮 Unity Ludus MCP Server (2026 Sovereign Standard)
# Purpose: Direct AI control of Unity HDRP & Luminous Plugins.
mcp = FastMCP("unity-ludus")

UNITY_HOST = os.getenv("UNITY_HOST", "http://127.0.0.1:30011")

@mcp.tool()
async def dispatch_plugin_command(command: str, plugin: str = "Luminous") -> dict:
    """
    ⚡ Universal Injection: Sends a C# or Luminous command directly to the Unity Editor.
    Use this to toggle neural solvers (NVIDIA Cosmos), change HDRP settings, or manipulate plugins.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{UNITY_HOST}/ludus/plugin/execute",
                json={"command": command, "plugin": plugin},
                timeout=30.0
            )
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

@mcp.tool()
async def execute_ludus_action(action: str, payload: dict) -> dict:
    """
    🎬 Dispatches a high-level Ludus AI command (BLOCKING_PASS, RENDER_CINEMATIC, etc.) to Unity.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{UNITY_HOST}/api/ludus/execute",
                json={
                    "version": "13.1",
                    "action": action,
                    "payload": payload,
                    "timestamp": "2026-05-03T22:00:00Z"
                },
                timeout=30.0
            )
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    mcp.run()
