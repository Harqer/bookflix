# BookCinema Architecture v2 (Professional Studio)

This document outlines the professional-grade, hybrid GenAI+CG filmmaking pipeline for BookCinema.

## 1. High-Level Architecture

BookCinema is built as a **Studio-in-a-Box**, integrating industry-standard DCC tools (Blender, Unreal, Nuke) with cutting-edge GenAI models (Gemini 1.5 Pro, Llama 3 LoRA, LongCatVideo).

### Infrastructure Stack
- **Frontend**: Next.js (Web) / Expo (iOS/Android) on Vercel.
- **Authentication**: Clerk (Universal Session Management).
- **Orchestration**: Node.js/tRPC (Serverless Compatible).
- **Background Workers**: BullMQ/Redis (GPU Job Management).
- **DCC Interface**: Model Context Protocol (MCP) Servers.
- **Infrastructure as Code**: Terraform (AWS + Vercel).
- **Database**: PostgreSQL (Neon) via Drizzle ORM.
- **Storage**: AWS S3 (High-volume Video Assets).

## 2. The Sovereign Studio Layer Model (v2026.04)

BookCinema has transitioned from general-purpose AI automation to a **Physically-Grounded Cinematic Pipeline**, leveraging NVIDIA's world-foundation models for technical execution and specialized LLMs for directorial intent.

### Layer 1: Narrative Intelligence (The Scout)
*   **Primary Agent**: **Gemini 1.5 Pro** (Context Specialist)
*   **Core Logic**: **Atmospheric DNA Extraction**. 
*   **Role**: Beyond plot points, it extracts the thematic weight, emotional subtext, and lighting/shading "anchors" directly from the book's prose.
*   **Deliverable**: Semantic World Bible (JSON).

### Layer 2: Creative Direction (The Director)
*   **Primary Agent**: **Claude 3.5 Sonnet** (Cinematic Supervisor)
*   **Core Logic**: **Semantic-to-Cinematic Mapping**.
*   **Role**: Translates the Scout's "Atmospheric DNA" into professional film language. It makes technical choices about focal lengths, lighting schemas (Three-Point), and composition (180-degree rule) based on film theory.
*   **Deliverable**: USD Directorial Brief (Metadata).

### Layer 3: Physical Execution (The Engine)
*   **Primary Platform**: **NVIDIA Cosmos** (World Foundation Model)
*   **Core Logic**: **Physical AI & Ray Tracing**.
*   **Role**: The "Newton" of our studio. It understands physics, object permanence, and light transport natively. It builds the 3D world based on the Director's USD Brief, ensuring the simulation is physically real.
*   **Tools**: **NVIDIA NIMs** (Specialized microservices for Lighting, Shading, and USD validation).

### Layer 4: Production Automation (DCC Department Heads)
This layer handles the professional-grade asset creation and polish via **Model Context Protocol (MCP)**.

| Platform | Role | Specialized Model |
| :--- | :--- | :--- |
| **Unreal / Unity** | Real-time Layout & Assembly | `unreal-mcp` / `unity-mcp` |
| **Houdini** | Professional Physics/VFX | `houdini-mcp` / `NeuralVDB` |
| **Maya / Blender** | Character Performance | `maya-mcp` / `blender-mcp` |
| **Nuke / Resolve** | Compositing & Color | `nuke_mcp` / `resolve-mcp` |
| **ComfyUI** | GenAI Texture & Motion Polish | `comfyui-mcp` (using FLUX.1/CogVideoX) |

### Layer 5: Experimental & Social (The Flywheel)
*   **Mojo Flywheel**: Used for training personal LLMs for user interaction. 
*   **Status**: Non-production critical. This layer is for user-driven creative play and fine-tuning, decoupled from the main cinematic pipeline.

## 3. The Filmmaking Pipeline: Semantic-to-Cinematic

1.  **Atmospheric Extraction**: Scout identifies the "soul" of the book (e.g., *Theme: Oppression*).
2.  **Directorial Translation**: Director maps "Oppression" to specific technical values (e.g., *Lens: 14mm, Angle: Low, Light: Chiaroscuro*).
3.  **USD Generation**: Director writes these values into a **USD Scene Description**.
4.  **Physical Simulation**: **NVIDIA Cosmos** executes the scene, ensuring the light bounces and physical motion are scientifically accurate.
5.  **Studio Polish**: The DCC MCPs and ComfyUI add the final cinematic textures, audio, and grading.

## 3. Deployment & Security

### Multi-tenant Isolation
Every production is assigned an **Isolated Security Volume** ([security-utils.ts](file:///home/shaolin/bookflix-main/server/security-utils.ts)) to prevent cross-contamination of assets and data.

### Infrastructure Management
The entire stack is deployed via **Terraform** ([infra/main.tf](file:///home/shaolin/bookflix-main/infra/main.tf)), allowing for rapid replication of "Studio Nodes" in different regions or for different clients.

## 4. Production Tracking (ShotGrid)
All shots, assets, and versions are automatically tracked in **ShotGrid / FlowPT** via the [shotgrid-client.ts](file:///home/shaolin/bookflix-main/server/shotgrid-client.ts), providing a professional production management interface.
