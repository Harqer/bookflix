# BookCinema: Sovereign DCC Fleet Management

## 🛰️ Architecture Overview
BookCinema utilizes a sovereign, high-performance production pipeline managed via **Spacelift** and executed on a **Private GPU Worker Pool**. All DCC agents (Digital Content Creation) are exposed as enterprise-grade **NVIDIA NIM Microservices**.

---

## 🚀 The 7-Phase Master Firing Cycle
The pipeline autonomously conducts every scene through the following sovereign sequence:

| Phase | Platform | Purpose | Integration |
|-------|----------|---------|-------------|
| **1** | **LongVideoCat-LLM** | Temporal Narrative DNA | Transformer-based Visual Tokens |
| **2** | **Blender / Houdini** | World Synthesis & Flow | Procedural USD Environment Prep |
| **3** | **Maya / DiffuMan** | Performance & Blocking | GenDoP Camera & Diffusion-Humans |
| **4** | **Unreal / Unity** | Cinematic Rendering | Luminous Plugin & Spatial Delivery |
| **5** | **Nuke / Gizmo** | VFX & Mastery | 4K Compositing & Pixel Mastery |
| **6** | **DaVinci Resolve** | Theatrical Mastering | HDR Grade & Dolby Atmos |
| **7** | **Remotion** | Web-Native Assembly | Mobile Dashboard & Dynamic Captions |

---

## 🛡️ Enterprise Execution Standards

### 1. Zero-Local Enforcement
- **Forbidden**: Manual `uvicorn` runs, `ngrok` tunnels, or fixed port `8000` servers.
- **Mandatory**: All services must be launched as NIM-compatible microservices via the `nim_service.launch` framework.
- **Ingress**: All communication is routed through **Sovereign Global Endpoints** protected by Arcjet.

### 2. GPU Resource Management
- **Provisioning**: Managed via `platform.tf` with Spacelift drift detection.
- **Safety**: Financial policies block any single run exceeding 5 concurrent GPU instances.
- **Workers**: All heavy rendering occurs on the `gpu_studio` private worker pool.

### 3. Repository Sovereignty
- **Sub-Modules**: No nested `.git` directories. All DCC bridges are part of the main sovereign repository to ensure atomic deployment and auditability.

---

## 🕵️ Maintenance & Auditing
- **Security**: Continuous audits via **Google Jules** and **CodeRabbit**.
- **Observability**: All Firing Cycles are traced via the Convex `logger` and the Sentry-MCP bridge.

**Status**: Production Ready
**Sovereignty Level**: Level 5 (Fully Isolated Private Cloud)
