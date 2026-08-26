# Design Brief — Frontend

## Your creative freedom

You are **NOT** bound by any existing design. Design your own visual direction for LectureScribe from scratch — palette, typography, button style, layout language, all your call.

## Screens you must design

| Screen | Key elements |
|---|---|
| **Landing page** (`/`) | Hero section with headline + CTAs, feature highlights, mid-page CTA, contact section, footer |
| **Trial page** (`/trial`) | Upload interface, processing status, results display, trial credits badge, exhaustion state with signup CTA |
| **Auth page** (`/login`) | Login form, signup form, toggle between modes, validation errors |
| **Workspace** (`/workspace`) | Upload zone, past lecture library grid, lecture detail view, user profile/logout |
| **About page** (`/about`) | Mission/hero section, problem/solution narrative, technology highlights |
| **Results view** | Tab switcher (Transcript / Notes), structured notes, copy/download/export, audio player, AI Tutor chat |
| **Processing states** | Upload progress, staged indicator, error states |
| **Navigation** | Top nav bar, menu dropdown, mobile navigation |

## Hard constraints (non-negotiable)

- **Mobile-responsive** across all pages
- **Accessible contrast** and readable type at every size (aim for WCAG AA)
- **Consistent** — apply your design system uniformly across all screens
- **No API keys** in frontend code

## Document your design

As you make choices, create a **`DESIGN.md`** in this folder documenting:

- Color palette (hex values + usage rules)
- Typography (font families, weights, sizes)
- Button styles (primary, secondary, states)
- Spacing system
- Component patterns (cards, modals, inputs, badges)
- Motion/animation guidelines

This becomes the reference for the whole team to stay consistent.

## Inspiration (optional)

Consider looking at: Notion, Linear, Vercel's dashboard, Stripe, Framer, Arc browser — or go in any direction you like.
