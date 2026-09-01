# Project State

Last updated: 2026-09-01 PDT
Current production version: 7800031f059006ce0cc5ef89f702e1dce1c03079
Current objective: serve the published 2026-2027 high-school first semester accurately with a mobile-first, immediately readable calendar while keeping source-marked gaps explicit
Completed work: extracted authenticated Yuque draft 71 without persisting private raw data; added 34 important events, 91 cycle days, 3 undated notices, and the new ICS feed; released the frontend-only mobile tab and day-sheet repairs, compact current-status header, teaching-week column, A–F cycle chips, adjusted-school-day and exam-week explanations, three-level type hierarchy, event titles in mobile cells, weekly-view demotion, and stronger dark day-state separation; live desktop/mobile light/dark Browser acceptance passed
Pending work: add the second semester and other divisions only when their official sources are published; rerun the same audit, feed, desktop, and mobile verification gates
Known problems: the supplied Yuque source contains only the high-school first semester; information technology, general technology, and academic-level qualification exam dates remain officially pending
Next recommended task: monitor the same Yuque authority for a second-semester or pending-date update; do not infer dates between releases
Deployment status: accepted on Cloudflare Pages deployment 7d53cf5e-1a2d-4145-8a7d-634f7ac854b3 from source 7800031; the custom domain loaded assets index-KVTZTNSU.js and index-DibKdf1C.css; 360/390/430px mobile hit tests, 390×844 day-sheet geometry, 1440×900 desktop, light/dark modes, zero console errors, and zero horizontal overflow all passed
Rollback anchor: immediate Cloudflare Pages deployment 2c6c2d44-fb10-48ab-896f-c3a752af3a63 (source f6d2993); secondary anchor 82770eea-a79a-4d18-9b0e-ca5cb61b1044
Operations authority: /Users/ylsuen/CF/sites/tools/calendar/docs/OPERATIONS.md
Ownership status: release complete after task-runtime cleanup and action-log closeout; no ongoing production ownership is implied
