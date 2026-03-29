---
name: design_snapshot_before_supabase_colors
description: Snapshot of the working design state before switching to Supabase brand colors — user wants to revert if needed
type: project
---

Current working design state (2026-03-29):

**Light theme colors:**
- bg: #faf9f7 (warm cream), accent: #6c5ce7 (purple), red: #ff6b6b, amber: #ffa94d, blue: #4dabf7, green: #51cf66
- text: #2d2a26, text-2: #7a756d, text-3: #b8b3ab
- border: #e2dfd8

**Dark theme colors:**
- bg: #18181b, accent: #a78bfa, red: #fb7185, amber: #fbbf24, blue: #60a5fa, green: #4ade80
- text: #fafaf9, text-2: #a1a1aa, text-3: #52525b

**Why:** User said "yoqmasan shunga qaytaramiz" — save this as rollback point before Supabase brand color experiment.

**How to apply:** If user wants to revert, restore these CSS variables in globals.css.
