# BookCinema TODO

## Theme & Design System
- [x] Configure warm/comfy color palette in theme.config.js (terracotta, parchment, espresso)
- [x] Update tailwind.config.js with brand colors (accent, gold, tint tokens)
- [x] Generate app logo/icon (book + film reel, terracotta/amber on espresso)
- [x] Update app.config.ts with BookCinema branding and logoUrl

## Database Schema
- [x] Add books table (id, userId, title, author, genre, rawText, status, productionStyle, tone)
- [x] Add chapters table (id, bookId, chapterNum, title, rawContent, screenplay, status)
- [x] Add worldBibles table (id, bookId, characters JSON, locations JSON, timeline JSON, themes JSON)
- [x] Add processingJobs table (id, bookId, stage, progress, logs JSON, isActive, isCancelled)
- [x] Add videoScenes table (id, chapterId, bookId, sceneNum, visualPrompt, keyframeImageUrl, status)
- [x] Run db:push migration (all 6 tables created successfully)

## Backend API (tRPC Routes)
- [x] books.submit — submit book text + metadata, triggers pipeline
- [x] books.list — list user's books with status
- [x] books.getById — get book with chapters and worldBible
- [x] books.delete — delete book and all assets
- [x] chapters.getById — get chapter with screenplay + scenes
- [x] chapters.getByBook — get all chapters for a book
- [x] worldBible.getByBookId — get full world bible
- [x] processing.getStatus — get real-time job status + logs
- [x] processing.cancel — cancel in-progress job

## AI Orchestration Engine
- [x] Book Analyst Agent — chapter splitting + initial world bible extraction
- [x] Continuity Supervisor Agent — persistent memory management per chapter
- [x] Screenwriter Agent — chapter to screenplay (Save the Cat template)
- [x] Visual Director Agent — screenplay to visual prompts + keyframes
- [x] Video Producer Agent — keyframe image generation via built-in AI
- [x] World Bible update logic after each chapter (merge new characters/locations)
- [x] Async pipeline processing (setImmediate background tasks)
- [x] Progress tracking and log streaming to processingJobs table
- [x] Fallback handling for all agents (graceful degradation)
- [x] Pipeline cancellation support

## Navigation & Tab Bar
- [x] Tab 1: Home (house icon)
- [x] Tab 2: Library (books icon)
- [x] Tab 3: Submit (plus.circle icon)
- [x] Tab 4: World Bible (globe icon)
- [x] Tab 5: Settings (gear icon)
- [x] All icon mappings added to icon-symbol.tsx (30+ icons)

## Home Screen
- [x] Welcome header with user name and stats
- [x] Stats row (Total Books, In Production, Completed)
- [x] "In Production" section with live status badges
- [x] "Recent Books" section with progress bars
- [x] Empty state with CTA button
- [x] 5-second polling for live status updates

## Library Screen
- [x] Book list with search and filter (all/active/complete)
- [x] Status badges with color coding
- [x] Delete book functionality
- [x] Empty state with CTA
- [x] 8-second polling for updates

## Submit Book Screen
- [x] Multi-step form (3 steps: Text → Metadata → Production Settings)
- [x] Text paste area with word/chapter/page count
- [x] Book metadata form (title, author, genre)
- [x] Production settings (style: cinematic/animated/documentary, tone)
- [x] Submit with loading state and redirect to book detail

## Book Detail Screen
- [x] Header with back navigation and live status badge
- [x] Production progress bar with stage labels
- [x] 6-stage pipeline visualization
- [x] Real-time agent activity log feed
- [x] Chapter list with per-chapter status
- [x] World Bible preview (character/location/timeline counts)
- [x] Cancel production button
- [x] 3-4 second polling for live updates

## Chapter View Screen
- [x] Screenplay view (monospace formatted text)
- [x] Visual Scenes view (keyframe images + scene details)
- [x] Scene cards with slugline, action lines, dialogue, visual prompt
- [x] Toggle between screenplay and scenes view
- [x] Loading states for in-progress generation

## World Bible Screen
- [x] Book selector (choose which book's bible to view)
- [x] Characters tab with detail cards (appearance, personality, arc)
- [x] Locations tab with visual cards (description, mood)
- [x] Timeline tab with chronological events
- [x] Empty state per tab

## Settings Screen
- [x] Profile section with user info
- [x] AI Orchestration explainer (5-agent pipeline info)
- [x] Production settings rows
- [x] Notification preferences toggle
- [x] About section
- [x] Sign out functionality

## Architecture & Documentation
- [x] ARCHITECTURE.md — full system design, AI orchestration plan, GitHub repos, scaling strategy
- [x] design.md — screen list, color choices, user flows, layout specs


## Full-Book Orchestration Pipeline (Phase 2)
- [x] Llama 4 Scout full-book context processing (10M token window)
- [x] Visual Bible generation (characters, locations, timeline, themes)
- [x] Scene breakdown generation (1000+ scenes for 2-hour film)
- [x] Detailed video prompt engineering (300-400 tokens per prompt)
- [x] HunyuanVideo-1.5 model evaluation (8.3B params, 14GB VRAM)
- [x] LongCat-Video research (13.6B params, native long-form)
- [x] Wan2.1 evaluation (14B params, high-quality T2V/I2V)
- [x] Unsloth/Axolotl batch processing orchestration
- [x] GPU cluster configuration (8x H100 for parallel processing)
- [x] Character consistency engine (embedding cache + I2I)
- [x] Color grading unification (unified palette per film)
- [x] FFmpeg assembly pipeline (1000+ clips to 2-hour film)
- [x] Audio generation integration (dialogue + background score)
- [x] Cost estimation and optimization strategies
- [x] End-to-end production workflow documentation


## Production Upgrades (Phase 2)
- [x] Upgrade orchestration.ts to Qwen2.5-1M (1M-token context)
- [x] Remove context window limitations from pipeline
- [x] Implement LangGraph state machine in orchestration.ts
- [x] Add ViMax RAG layer with vector database (Chroma)
- [x] Integrate HuggingFace embeddings for semantic search
- [x] Add real-time WebSocket updates for production tracking
- [x] Upgrade Home screen with live progress indicators
- [x] Add advanced filtering and search to Library screen
- [x] Implement character consistency scoring in World Bible
- [x] Add production logs and debugging tools
- [x] Optimize batch processing for HunyuanVideo
- [x] Add cost estimation and analytics dashboard


## AI Director Agent (Phase 3)
- [ ] Implement AIDirectorAgent core class with narrative analysis
- [ ] Integrate Qwen2.5-1M for full-book context processing
- [ ] Add genre profile system (7 genres with cinematographic conventions)
- [ ] Implement scene breakdown logic
- [ ] Integrate GenDoP model for camera trajectory generation
- [ ] Add genre-specific camera profiles and constraints
- [ ] Implement FILMAGENT multi-agent collaboration (critique-correct-verify)
- [ ] Add character blocking determination
- [ ] Implement debate-judge validation strategy
- [ ] Add lighting setup generation
- [ ] Implement batch processing for multiple chapters
- [ ] Add real-time progress tracking and analytics
- [ ] Create tRPC endpoint for orchestrateWithAIDirector
- [ ] Test end-to-end with sample book


## Phase 4: Full-Book File Upload & Auto-Generation
- [x] File upload service (PDF, EPUB, DOCX support)
- [x] PDF extraction with pdfjs or poppler
- [x] EPUB parsing with epub library
- [x] DOCX parsing with docx library
- [x] Text normalization and cleanup pipeline
- [x] Chapter auto-detection and splitting
- [x] Full-book context processing with Qwen2.5-1M
- [x] Auto-orchestration engine (no manual prompts)
- [x] World Bible auto-generation from full book
- [x] End-to-end pipeline orchestration
- [x] File picker UI component
- [x] Upload progress tracking
- [x] Error handling and retry logic
- [x] Storage and caching optimization
