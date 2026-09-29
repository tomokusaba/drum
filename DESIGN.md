# Design system

## Direction

An operator's instrument panel: dense enough to make sound and sequence visible together, but organized around direct controls rather than stacked settings cards. The surface uses cool machine grey, near-black hardware, signal orange for the selected pad, and cobalt for transport and active steps. The square-cornered controls, thin structural rules, labeled keys, and compact measurements carry the physical instrument language.

## Tokens

- **Canvas:** `#dce0df`
- **Panel:** `#e9eceb`
- **Raised control:** `#f5f6f5`
- **Ink:** `#151a1d`
- **Secondary ink:** `#485256`
- **Control blue:** `#1747d1` with white foreground
- **Hit orange:** `#f0643d` with dark foreground
- **Beat marker:** `#f2c94c`
- **Rules:** `#9aa3a3` and `#333d40`

## Typography

Segoe UI for interface copy, Bahnschrift Condensed for instrument headings and the wordmark, and Cascadia Mono for measured values and compact labels, each with cross-platform system fallbacks. No remote font loads are required.

## Components and state

- Use native buttons, selects, labels, and range inputs; controls have visible focus and a 44px minimum target where practical.
- Pads are dark physical controls; the selected pad uses orange and a visible selection state, while a hit briefly adds an inset ring and presses the pad.
- Arrange pads and sequencer lanes in ascending GM percussion-note order; show each pad's GM note/name and home-row trigger key.
- Active sequencer steps use a blue fill, heavier border, yellow marker, and `aria-pressed`; beat positions use stronger cell borders and bold step numbers.
- The playhead is an outline, independent of step-on color. Respect reduced-motion preferences.
- Keep the sequencer horizontally scrollable on narrow screens, with a visible, labeled button for every instrument/step pair.

## Layout

On wide screens, place the pad bank beside the selected voice's parameter bank; place the 16-step timeline beneath them. Collapse the workbench to one column on tablet and mobile. Keep the sequencer as the only intentionally horizontally scrolling surface.
