# BookCinema — Mobile App Interface Design

## Brand Identity

**Name:** BookCinema  
**Tagline:** "Every Book Deserves a Screen"  
**Personality:** Warm, cinematic, creative, sophisticated yet approachable

## Color Palette (Warm & Comfy)

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `primary` | `#C2703A` | `#E8935A` | Amber/terracotta — CTAs, accents |
| `background` | `#FDF6EE` | `#1A1208` | Warm cream / deep espresso |
| `surface` | `#F5EBD8` | `#2A1E10` | Cards, panels — warm parchment |
| `foreground` | `#2D1B0E` | `#F5E6D0` | Primary text — dark brown |
| `muted` | `#8B6E52` | `#A08060` | Secondary text — warm taupe |
| `border` | `#E8D5BA` | `#3D2A18` | Dividers — warm sand |
| `success` | `#5C8A4A` | `#7AB060` | Success — forest green |
| `warning` | `#D4943A` | `#F0B050` | Warning — golden amber |
| `error` | `#C04040` | `#E06060` | Error — warm red |
| `tint` | `#C2703A` | `#E8935A` | Tab bar active |

## Typography

- **Display:** System font bold, 32-40px — book titles, hero text
- **Heading:** System font semibold, 20-24px — section headers
- **Body:** System font regular, 15-16px — screenplay text, descriptions
- **Caption:** System font regular, 12-13px — metadata, timestamps
- **Screenplay:** Monospace (Courier-style), 13px — script display

## Screen List

### 1. Home Screen (`/`)
**Primary Content:** Hero banner with featured production, horizontal scroll of "In Production" books, vertical list of "Recently Completed" chapters, quick-start floating button.  
**Functionality:** Pull-to-refresh, tap book → Book Detail, tap chapter → Chapter View.

### 2. Library Screen (`/library`)
**Primary Content:** Grid of book cards with cover art (AI-generated), title, author, chapter count, processing status badge (Analyzing / Scripting / Filming / Complete).  
**Functionality:** Search bar, filter by status, long-press for quick actions (delete, share).

### 3. Submit Book Screen (`/submit`)
**Primary Content:** Multi-step form — Step 1: Paste text or upload file; Step 2: Book metadata (title, author, genre); Step 3: Production settings (style, tone, target length).  
**Functionality:** Text area with character count, document picker for .txt/.epub/.pdf, genre selector chips, submit button with haptic feedback.

### 4. Book Detail Screen (`/book/:id`)
**Primary Content:** AI-generated movie poster (top hero), book metadata, production progress bar, chapter list with status indicators, World Bible preview cards.  
**Functionality:** Tap chapter → Chapter View, tap "World Bible" → World Bible screen, share production.

### 5. Chapter View Screen (`/book/:id/chapter/:num`)
**Primary Content:** Video player (top half), screenplay text (scrollable bottom half), scene navigator dots, character appearances in this chapter.  
**Functionality:** Video playback controls, screenplay text synchronized with video, swipe left/right to navigate chapters.

### 6. Processing Screen (`/book/:id/processing`)
**Primary Content:** Animated pipeline visualization showing 5 agent stages, real-time log feed, estimated time remaining, chapter-by-chapter progress grid.  
**Functionality:** Live status polling (every 5s), cancel button, background notification when complete.

### 7. World Bible Screen (`/book/:id/world-bible`)
**Primary Content:** Tab navigation — Characters | Locations | Timeline. Character cards with AI portrait, name, description, chapter appearances. Location cards with visual prompt and mood. Timeline of key events.  
**Functionality:** Tap character → expanded modal with full details, search characters/locations.

### 8. Settings Screen (`/settings`)
**Primary Content:** Profile section, notification preferences, production quality (Draft/Standard/Cinematic), video generation backend selector, theme toggle.  
**Functionality:** Toggle switches, segmented controls, logout button.

## Key User Flows

### Flow 1: Submit a Book
Home → FAB (+) → Submit Screen → Paste/Upload Text → Add Metadata → Choose Style → Submit → Processing Screen (auto-navigate) → Notification when complete

### Flow 2: Watch a Chapter
Library → Book Card → Book Detail → Chapter Card → Chapter View → Video Player → Swipe to next chapter

### Flow 3: Explore World Bible
Book Detail → "World Bible" button → Characters tab → Tap character card → Character modal with full history

## Layout Principles

- **One-handed reach:** Primary actions (FAB, tab bar) within thumb zone
- **Cinematic feel:** Full-bleed images, film-grain texture overlays on cards
- **Progressive disclosure:** Show status at a glance, details on tap
- **Warm depth:** Layered surfaces using warm shadow colors (#C2703A at 10% opacity)
- **Typography hierarchy:** Clear distinction between book titles (display), chapter names (heading), and screenplay text (monospace)

## Component Design

### Book Card
- Rounded corners (16px)
- AI-generated cover art (3:4 ratio)
- Status badge (top-right corner, colored dot)
- Title + author below
- Progress bar at bottom

### Chapter Card
- Horizontal layout
- Chapter number (large, amber)
- Chapter title + word count
- Status icon (lock/play/check)
- Estimated video duration

### Pipeline Stage Indicator
- 5 circular nodes connected by lines
- Active node: amber fill + pulse animation
- Completed node: green check
- Pending node: gray outline
- Labels: Analyze / Script / Direct / Film / Assemble

### Agent Activity Feed
- Monospace font for authenticity
- Color-coded by agent (each agent has unique warm color)
- Scroll to bottom auto-follow
- Collapsible sections per agent
