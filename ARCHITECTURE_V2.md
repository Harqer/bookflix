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

## 2. The Filmmaking Pipeline

The pipeline is divided into five distinct stages, orchestrated by specialized AI agents.

### Phase 1: Narrative Analysis (Gemini 1.5 Pro)
- **World Bible Extraction**: Analyzes 1M+ tokens of book text to extract characters, locations, and thematic rules.
- **Chapter Splitting**: High-fidelity semantic segmentation of the narrative.

### Phase 2: Screenplay & Directing (Director-LoRA)
- **Screenplay Generation**: Llama 3 fine-tuned for industry-standard screenplay formatting.
- **Directing (GenDoP)**: Generates mathematically precise camera trajectories and shot lists.

### Phase 3: Previz & 3D Layout (Blender/Unreal MCP)
- **CG Layout**: AI agents trigger the **Blender MCP Server** to set up 3D scenes based on the World Bible.
- **Camera Animation**: Camera paths are animated in 3D space to ensure physical accuracy.
- **Pass Rendering**: Structural passes (Depth, Normal, Object ID) are rendered.

### Phase 4: GenAI Production (LongCat/Runway)
- **Texture & Motion**: GenAI models use the CG passes as control signals to generate photorealistic textures and organic motion.
- **Long-Form Continuation**: Autoregressive video generation for chapter-to-episode continuity.

### Phase 5: Professional Compositing (Nuke MCP)
- **Final Comp**: The **Compositing MCP Server** triggers Nuke/ComfyUI to blend CG structural layers with GenAI texture layers.
- **Post-Processing**: Color grading, grain, and high-fidelity 4K output.

## 3. Deployment & Security

### Multi-tenant Isolation
Every production is assigned an **Isolated Security Volume** ([security-utils.ts](file:///home/shaolin/bookflix-main/server/security-utils.ts)) to prevent cross-contamination of assets and data.

### Infrastructure Management
The entire stack is deployed via **Terraform** ([infra/main.tf](file:///home/shaolin/bookflix-main/infra/main.tf)), allowing for rapid replication of "Studio Nodes" in different regions or for different clients.

## 4. Production Tracking (ShotGrid)
All shots, assets, and versions are automatically tracked in **ShotGrid / FlowPT** via the [shotgrid-client.ts](file:///home/shaolin/bookflix-main/server/shotgrid-client.ts), providing a professional production management interface.
