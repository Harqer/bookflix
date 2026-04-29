import os
import sys
import subprocess

# Enterprise Shim for Nuke MCP
# Points to the specialized Nuke MCP server implementation in the /mcp directory.

def run_nuke_mcp():
    venv_python = "/home/shaolin/bookflix-main/.venv/bin/python3"
    server_main = "/home/shaolin/bookflix-main/mcp/nuke_mcp/main.py"
    
    if not os.path.exists(venv_python):
        print(f"Error: Virtual environment not found at {venv_python}", file=sys.stderr)
        sys.exit(1)
        
    if not os.path.exists(server_main):
        print(f"Error: Nuke MCP server not found at {server_main}", file=sys.stderr)
        sys.exit(1)

    # Forward arguments and stdio
    # FastMCP uses stdio for MCP communication when run via main.py
    os.execv(venv_python, [venv_python, server_main] + sys.argv[1:])

if __name__ == "__main__":
    run_nuke_mcp()
