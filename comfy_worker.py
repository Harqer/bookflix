import modal
import os
from fastapi import FastAPI, Request

# 🚀 CINEGRAPH STYLE CLUSTER: Phase 4 Orchestrator
# Purpose: High-speed Style Transfer, Keyframe Consistency, and IP-Adapter.
# Cluster: Sovereign Aesthetic Fleet.

app = modal.App("cinegraph-style-cluster")
web_app = FastAPI()

# 🏛️ SOVEREIGN WEIGHT STORAGE
weights_volume = modal.Volume.from_name("comfy-weights-storage", create_if_missing=True)

# 🏛️ SOVEREIGN SECRET VAULT
studio_secrets = modal.Secret.from_name("studio-secrets")

# 🏛️ Style Image Definition: Layered for Sovereign Performance
image = (
    modal.Image.debian_slim()
    # Layer 1: Stable OS Binaries
    .apt_install("git", "ffmpeg", "libgl1", "libglib2.0-0", "wget")
    # Layer 2: Core ML Frameworks
    .pip_install("torch", "torchvision", "torchaudio", "boto3", "fastapi[standard]", "requests", "websocket-client")
    # Layer 3: ComfyUI Core & ViMax (The 'Stop and Proceed' Repo)
    .run_commands(
        "pip install uv",
        "git clone https://github.com/comfyanonymous/ComfyUI.git /opt/ComfyUI",
        "cd /opt/ComfyUI && pip install -r requirements.txt",
        "git clone https://github.com/HKUDS/ViMax /opt/ViMax",
        "cd /opt/ViMax && uv pip compile pyproject.toml -o requirements.txt && uv pip install -r requirements.txt --system"
    )
    .env({
        "COMFY_PATH": "/opt/ComfyUI", 
        "WEIGHTS_PATH": "/mnt/weights",
        "VIMAX_PATH": "/opt/ViMax"
    })
)

@app.function(
    image=image,
    gpu="A10G", # 💡 Optimized tier: A10G is perfect for Style Transfer & IP-Adapter (saves 60% cost vs A100)
    volumes={"/mnt/weights": weights_volume},
    secrets=[studio_secrets], # 🔐 Secure Injection
    timeout=1200,
)
async def style_transfer_logic(payload: dict):
    """🛰️ Internal Style Logic: Applying the Cinematic Lens via ComfyUI API"""
    import json
    import requests
    import time
    import uuid
    import subprocess
    
    # 🛰️ Heartbeat: Reporting to Upstash Redis for Edge status tracking
    redis_url = os.environ.get("UPSTASH_REDIS_REST_URL")
    redis_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    
    scene_id = payload.get("sceneId")
    if redis_url and redis_token:
        requests.post(f"{redis_url}/set/status_{scene_id}/styling", headers={"Authorization": f"Bearer {redis_token}"})
    
    prompt_text = payload.get("prompt")
    scene_id = payload.get("sceneId")
    workflow_path = payload.get("workflow", "/opt/ComfyUI/workflows/cinematic_style.json")
    
    print(f"🎨 Style Cluster: Applying Lens to Prompt: {prompt_text}")
    
    # 🚀 Step 1: Launch Headless ComfyUI (if not running)
    # In a real Modal production, we'd manage this more gracefully
    server_process = subprocess.Popen(["python", "/opt/ComfyUI/main.py", "--listen", "127.0.0.1", "--port", "8188"])
    time.sleep(10) # Wait for bootstrap
    
    try:
        # 🚀 Step 2: Load Workflow & Inject Parameters
        with open(workflow_path, 'r') as f:
            workflow = json.load(f)
            
        # Example Injection (Logic depends on your JSON structure)
        # We find the node with class "CLIPTextEncode" and inject prompt
        for node_id in workflow:
            if workflow[node_id].get("class_type") == "CLIPTextEncode":
                workflow[node_id]["inputs"]["text"] = prompt_text
        
        # 🚀 Step 3: Queue Prompt
        client_id = str(uuid.uuid4())
        resp = requests.post("http://127.0.0.1:8188/prompt", json={
            "prompt": workflow,
            "client_id": client_id
        })
        prompt_id = resp.json().get("prompt_id")
        
        # 🚀 Step 4: Poll for Completion
        while True:
            history_resp = requests.get(f"http://127.0.0.1:8188/history/{prompt_id}")
            history = history_resp.json()
            if prompt_id in history:
                break
            time.sleep(2)
            
        # 🚀 Step 5: Extract Output URL
        # For simulation, we return the assumed asset path
        frame_url = f"https://assets.cinegraph.studio/renders/scene_{scene_id}_style.png"
        
        return {
            "status": "stylized",
            "prompt_id": prompt_id,
            "cluster": "SOVEREIGN_AESTHETIC_01",
            "frame_url": frame_url
        }
        
    finally:
        server_process.terminate()

@web_app.post("/dispatch/style")
async def dispatch_style(request: Request):
    payload = await request.json()
    return await style_transfer_logic.remote(payload)

@app.function(image=image, secrets=[studio_secrets])
@modal.asgi_app()
def fastapi_app():
    return web_app
