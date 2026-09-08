# Native platform guidance

Apply the surface's mode and product contract; native screens commonly use **Operate**, but content readers and galleries may differ. Platform expectations are functional constraints, not optional aesthetic references. Adapt the existing native codebase rather than introducing a web-style navigation system or a new UI framework.

## Build with the platform

- Use the platform's standard navigation model and controls where they meet the task. On iOS, distinguish hierarchical navigation, top-level tabs, and self-contained sheet tasks. Preserve expected back behavior and interactive dismissal where appropriate; warn before losing work.
- Keep device safe areas, system bars, scrolling edges, keyboard avoidance, and bottom action placement correct. A fixed action must remain reachable when text input is active.
- Support text scaling and content-driven sizing rather than assuming a single line or fixed label height. On iOS, use Dynamic Type and test a larger accessibility size; permit scrolling when content outgrows the viewport.
- Give controls accessible names, roles, values, state, and a sensible traversal order. Use comfortable targets (normally at least 44 by 44 points on iOS; follow the target platform's conventions elsewhere). Expose a non-gesture path for essential actions.
- Use semantic colors and existing theme tokens. Support relevant light/dark and increased-contrast settings without making color the only signal.
- Reuse motion and haptic conventions for meaningful feedback. Respect reduced motion; haptics or animation must not be the only indication of success or failure.
- Ask for permissions when their purpose is evident. Explain denial and a viable recovery route without trapping users in a repeated prompt. Model offline and interrupted work where the flow requires them.

## Adapt beyond a phone screenshot

For the requested device classes, determine navigation, content width, multi-column behavior, and sheet presentation intentionally. A tablet should not automatically be a stretched phone; a narrow screen should not hide essential actions. Consider orientation, keyboard/input method, long localized labels, and right-to-left layout when relevant to the product's support requirements.

## Native finish-gate batch

Use the same inspect-once, fix-once, confirm-at-most-once budget as [SKILL.md](../SKILL.md). In the initial device/simulator batch, cover:

1. The primary task and its critical alternate state with representative content.
2. Back navigation/dismissal, keyboard appearance, scrolling, and safe-area behavior.
3. Larger text and any supported theme or reduced-motion state affected by the change.
4. Accessible naming/order with the available platform inspection tools; distinguish inspection from an actual screen-reader interaction session.

If no native runtime is available, use supplied screenshots for visual observations and inspect native layout/accessibility code for specific risks. State that navigation, gestures, text scaling, and runtime behavior remain unverified unless actually exercised. A web preview or static image cannot establish a native pass.
