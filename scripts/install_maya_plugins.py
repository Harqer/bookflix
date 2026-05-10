import modal
import os
import shutil
import subprocess

# 🚀 SOVEREIGN DCC FLEET POPULATOR (Modal 1.4+ Edition)
# Purpose: Installs Arnold, Golaem, and MotionBuilder into the persistent volume.

app = modal.App("maya-plugin-installer")
dcc_volume = modal.Volume.from_name("dcc-fleet-storage")

# 🏛️ DEFINE THE BUILD IMAGE WITH LOCAL BINARIES
# We use .add_local_file to "Siphon" the local downloads into the cluster.
image = (
    modal.Image.debian_slim()
    .apt_install("tar", "unzip", "wget")
    .add_local_file(
        os.path.expanduser("~/Downloads/Arnold-7.5.0.0-linux.tgz"),
        remote_path="/mnt/downloads/Arnold-7.5.0.0-linux.tgz"
    )
    .add_local_file(
        os.path.expanduser("~/Downloads/Autodesk_Maya_2027_Linux_64bit.tgz"),
        remote_path="/mnt/downloads/Autodesk_Maya_2027_Linux_64bit.tgz"
    )
    .add_local_file(
        os.path.expanduser("~/Downloads/Autodesk_MotionBuilder_2027_English_Linux_64bit.tgz"),
        remote_path="/mnt/downloads/Autodesk_MotionBuilder_2027_English_Linux_64bit.tgz"
    )
    .add_local_file(
        os.path.expanduser("~/Downloads/Golaem-9.3-Maya2027-linux.run"),
        remote_path="/mnt/downloads/Golaem-9.3-Maya2027-linux.run"
    )
)

@app.function(
    volumes={"/mnt/dcc": dcc_volume},
    image=image,
    timeout=3600
)
def install_plugins():
    """🛡️ Installs the DCC binaries into the Sovereign Volume."""
    
    # 🏛️ ARNOLD INSTALLATION
    arnold_archive = "/mnt/downloads/Arnold-7.5.0.0-linux.tgz"
    if os.path.exists(arnold_archive):
        print("🚀 Installing Arnold 7.5...")
        os.makedirs("/mnt/dcc/Arnold", exist_ok=True)
        subprocess.run(["tar", "-xzf", arnold_archive, "-C", "/mnt/dcc/Arnold"], check=True)
        print("✅ Arnold Installed.")

    # 🏛️ GOLAEM INSTALLATION
    golaem_run = "/mnt/downloads/Golaem-9.3-Maya2027-linux.run"
    if os.path.exists(golaem_run):
        print("🚀 Installing Golaem 9.3...")
        os.makedirs("/mnt/dcc/Golaem", exist_ok=True)
        subprocess.run(["chmod", "+x", golaem_run], check=True)
        # Golaem .run in silent mode
        subprocess.run([golaem_run, "--mode", "silent", "--dir", "/mnt/dcc/Golaem"], check=True)
        print("✅ Golaem Installed.")

    # 🏛️ MOTIONBUILDER INSTALLATION
    mb_archive = "/mnt/downloads/Autodesk_MotionBuilder_2027_English_Linux_64bit.tgz"
    if os.path.exists(mb_archive):
        print("🚀 Installing MotionBuilder 2027...")
        os.makedirs("/mnt/dcc/MotionBuilder", exist_ok=True)
        subprocess.run(["tar", "-xzf", mb_archive, "-C", "/mnt/dcc/MotionBuilder"], check=True)
        print("✅ MotionBuilder Installed.")

    # 🏛️ MAYA 2027
    maya_archive = "/mnt/downloads/Autodesk_Maya_2027_Linux_64bit.tgz"
    if os.path.exists(maya_archive):
        print("🚀 Installing Maya 2027 Base...")
        os.makedirs("/mnt/dcc/Maya", exist_ok=True)
        subprocess.run(["tar", "-xzf", maya_archive, "-C", "/mnt/dcc/Maya"], check=True)
        print("✅ Maya 2027 Installed.")

    dcc_volume.commit()
    return "All Plugins Installed and Committed to Sovereign Storage."

if __name__ == "__main__":
    with app.run():
        print("🛰️ Sovereign: Uploading local Downloads via Image Layer and dispatching installer...")
        result = install_plugins.remote()
        print(f"✅ {result}")
