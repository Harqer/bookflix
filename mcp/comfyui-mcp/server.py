import json
import requests
from typing import Dict, Any

"""
🎨 ComfyUI MCP (Model Context Protocol) Server
2026 Production Standard: Node-Based Visual Logic & Character Consistency
"""

class ComfyUIMCPServer:
    def __init__(self, url='http://127.0.0.1:8188'):
        self.url = url

    def run_workflow(self, workflow_path: str, params: Dict[str, Any]):
        """
        🚀 Dispatches a scene description to a ComfyUI workflow.
        """
        with open(workflow_path, 'r') as f:
            workflow = json.load(f)

        # 🧠 Dynamic Parameter Injection (Prompt, Seed, LoRA)
        # Assuming Node ID 6 is the CLIP Text Encode for the prompt
        if "6" in workflow:
            workflow["6"]["inputs"]["text"] = params.get("prompt", "")

        response = requests.post(f"{self.url}/prompt", json={"prompt": workflow})
        return response.json()

if __name__ == "__main__":
    print("🎨 ComfyUI MCP Bridge Initialized. Ready for high-fidelity visual logic.")
