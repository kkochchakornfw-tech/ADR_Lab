---
name: ADR · PGx follow-up
world: pill-organizer (own)
mode: operate
tokens:
  color:
    bg: "#f3f4f6"
    surface: "#ffffff"
    line: "#e2e5ea"
    ink: "#151821"
    ink-3: "#5f6776"
    accent: "#2448c9"
    over: "#d42d22"
    lid-w1: "#ff5d73"
    lid-w2: "#ff9a3c"
    lid-w3: "#f5c533"
    lid-w4: "#34bf8a"
    lid-w9: "#4a8df8"
    adr-ok: "#1d9a62"
    adr-side: "#c78b00"
    adr-minor: "#e0533d"
    adr-major: "#9a0f19"
  font:
    ui: "Anuphan"
    heading: "Bai Jamjuree"
    document: "Sarabun"
  radius: { sm: 6px, base: 10px, lg: 14px, lid: 10px }
  motion:
    ease-out: "cubic-bezier(0.23, 1, 0.32, 1)"
    ease: "cubic-bezier(0.22, 1, 0.36, 1)"
---

# Design system

Source of truth for tokens: `src/styles.css` `:root`.

## World

A real weekly pill box. Every started patient carries a white plastic tray with five compartments, W1 W2 W3 W4 W9, each under its own translucent candy-coloured lid (pink, orange, yellow, green, blue) like a drugstore organizer. The chrome around it stays quiet: cool white, ink, one cobalt for actions. Colour belongs to the lids.

## Compartment states (the lid's physical position)

| State | Look | Meaning |
|---|---|---|
| later | lid shut, week label embossed | not due yet |
| due | lid flipped up over the hinge, cobalt-rimmed cavity reading "โทร" | call due today |
| over | lid flipped up, red-rimmed cavity with "!" | past due, case active |
| done | lid shut, paler, a capsule inside coloured by ADR result | call recorded |
| skip | grey lid sealed with paper tape, "ไม่ใช้" | protocol skips this week |
| hold | grey lid | PGx still Waiting |
| missed | grey lid, struck date | past due, case closed |

Hover lifts a shut lid slightly (peek); recording a call drops the capsule in. One ease-out curve, no overshoot.

## Colour rules

- Lid colours identify the week (also used for calendar entries). They never carry status.
- Cobalt (`--accent`) means something to do: primary buttons, today's open compartment, counts in the nav.
- Red (`--over`) means overdue, Positive PGx, a missing allergy card, or destructive actions.
- Capsule colours = ADR outcome: green no ADR, ochre side effects, coral minor allergy, deep red major allergy. No violet.

## Type

Bai Jamjuree for headings, phone numbers and figures; Anuphan for UI text; Sarabun for the printed report. Tabular numerals on HN, phones, dates and counts. Buddhist-era dates.

## Components

- Top bar: brand (mini pill box), tab navigation with an ink underline, "เพิ่มผู้ป่วย" primary button.
- Today page leads with a sentence ("วันนี้ต้องโทรติดตาม 3 ราย") and inline counts, not stat cards.
- Selected radio options fill ink; ADR options fill with their capsule colour.
- Patient form: right-side sheet. Call recorder: centred dialog opened from a compartment.
- Delete confirms, then offers undo in a toast.

## Motion

Lids flip in 320ms on the single ease-out curve, capsules drop in, sheets slide on a drawer curve, buttons press to 0.97. Nothing animates on page load. Reduced motion removes lid and capsule movement.
