import requests
import os
import json
import sys

"""
🔒 TFC Secret Sync Utility (Enterprise Grade)
Uses the Terraform Cloud API to programmatically set sensitive workspace variables.
"""

TFC_TOKEN = os.getenv("TERRAFORM_ORGANIZATION_TOKEN")
WORKSPACE_ID = os.getenv("TFC_WORKSPACE_ID") # e.g. ws-xxxxxxxx
ORG_NAME = "your-org-name"

HEADERS = {
    "Authorization": f"Bearer {TFC_TOKEN}",
    "Content-Type": "application/vnd.api+json"
}

def set_tfc_variable(key: str, value: str, description: str = "Automated Sync"):
    url = f"https://app.terraform.io/api/v2/workspaces/{WORKSPACE_ID}/vars"
    
    payload = {
        "data": {
            "type": "vars",
            "attributes": {
                "key": key,
                "value": value,
                "description": description,
                "category": "terraform",
                "hcl": False,
                "sensitive": True # 🛡️ SECURE: Hides value from UI/API
            }
        }
    }
    
    print(f"🚀 Syncing {key} to TFC...")
    response = requests.post(url, headers=HEADERS, json=payload)
    if response.status_code == 201:
        print(f"✅ Successfully synced {key}")
    else:
        print(f"❌ Failed to sync {key}: {response.text}")

if __name__ == "__main__":
    if not TFC_TOKEN or not WORKSPACE_ID:
        print("❌ Missing TFC_TOKEN or TFC_WORKSPACE_ID")
        sys.exit(1)
    
    # 📝 List of secrets to sync (Values should be passed via env vars)
    # set_tfc_variable("anthropic_api_key", os.getenv("ANTHROPIC_API_KEY"))
    # ... etc
