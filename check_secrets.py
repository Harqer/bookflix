import modal
import os

app = modal.App("secret-checker")

@app.function(secrets=[modal.Secret.from_name("studio-secrets")])
def check_studio_secrets():
    print("\n🔍 Sovereign: Checking Modal Studio Secrets...")
    
    secret_key = "GPU_CLUSTER_SECRET"
    if secret_key in os.environ:
        print(f"✅ FOUND: {secret_key}")
        print(f"🔑 VALUE: {os.environ[secret_key]}")
    else:
        print(f"❌ MISSING: {secret_key} was not found in the 'studio-secrets' vault.")
        print("\nAvailable keys in vault:")
        for key in os.environ:
            if not key.startswith("MODAL_") and not key.startswith("PATH"):
                print(f" - {key}")

if __name__ == "__main__":
    with app.run():
        check_studio_secrets.remote()
