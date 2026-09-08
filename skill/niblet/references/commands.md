# Niblet command playbook

These names select a task for the coding agent. Invoke them in ordinary language (for example, “Use Niblet polish on the billing screen”). Slash syntax works only if the host registers it. There is no command-line dispatcher in this skill.

Apply the design contract and finish gate in [SKILL.md](../SKILL.md) to every implementation command. Select the requested command, not a chain of every command. The output for a planning or review command is its stated artifact; it does not authorize code changes. Use an existing surface brief for persistent artifacts, and create a document only when requested.

## Define and build

### `craft` — alias for ordinary new work

Read the product's local vocabulary and components, establish the contract, then implement the primary journey and applicable states. Choose a coherent hierarchy and responsive structure before decorating individual components. Use truthful representative content. Completion: the requested surface works end to end and has a recorded finish-gate result.

### `shape` — resolve the direction before implementation

Translate an ambiguous request into the surface's mode, content hierarchy, main interaction, identity, and state plan. Resolve the decision with the largest downstream impact first; compare alternatives only when there is a real trade-off. Completion: a compact actionable design contract, with consequential open decisions called out. This is planning, not permission to rebuild the surface.

### `init` — capture durable product context

Inspect the brief, routes/screens, components, tokens, typography, assets, and existing conventions. Capture product purpose, users, workflows, platform, constraints, and observed authority in `PRODUCT.md`, preserving existing facts. `teach` is an alias. Resume the original design task afterward without repeating discovery. Completion: durable product context that later work can use. No setup script, framework installation, or global design-system rewrite is implied.

### `document` — record the existing design system

Generate or update `DESIGN.md` from observed component roles, tokens, typography, layout rules, states, accessibility requirements, and exceptions. Separate current behavior from proposed decisions and include file/screen evidence. Completion: a usable record of the actual system, not an aspirational style guide.

### `extract` — consolidate proven repetition

Find genuinely repeated UI patterns and token values in the requested area, then move them into the product's existing component/token structure. Preserve semantics, appearance, and behavior while migrating every affected caller. Completion: repeated decisions have one clear owner and the rendered consumers remain equivalent. A single occurrence is not evidence for a new abstraction.

## Understand and assess

### `critique` — explain the highest-impact design problems

Read the contract and inspect the available rendered surface. Evaluate whether hierarchy, density, content, and interactions support its mode. Return a short ranked set of specific observations, user consequences, and proposed corrections. Distinguish observed defects from unverified concerns. Completion: an actionable critique; do not modify code unless asked.

### `audit` — examine coverage and readiness

Review the requested surfaces systematically against their contracts: required states, accessibility, responsive/native behavior, consistency, and functional affordances. For each finding, record the location/state, evidence, severity, and smallest correction. Mark unexercised checks explicitly. Completion: a bounded findings list and readiness status. This is local agent review, not a hosted review service or numerical quality certification.

## Refine the presentation

### `polish` — remove visible inconsistency

Preserve the refinement contract. Correct uneven spacing, alignment, typography, icon sizing, content wrapping, and feedback inconsistencies that remain after functionality is complete. Prioritize defects visible in the actual layout. Completion: a coherent version of the same interface, not a new visual identity.

### `bolder` — increase meaningful emphasis

Strengthen the most important content through scale, contrast, typography, deliberate imagery, or composition. Keep secondary controls subordinate and preserve legibility and product identity. Completion: the intended focal point is unmistakable without making every element compete.

### `quieter` — reduce competing emphasis

Reduce unnecessary borders, fills, shadows, saturated accents, and competing type treatments. Preserve essential status, focus, affordances, and contrast. Completion: the hierarchy is calmer while actions and state remain discoverable.

### `distill` — simplify the task or surface

Identify what the user must understand or do, then remove redundant presentation and combine unnecessary steps within the authorized scope. Use progressive disclosure only for genuinely secondary content. Completion: less visible complexity without silently removing required information, capability, or accessibility.

### `colorize` — give color a clear role

Work from existing semantic tokens. Distinguish action, selection, feedback, and decoration; use restrained accents where they improve comprehension. Check contrast in relevant themes and pair status colors with text or shape. Completion: a coherent color system for the changed scope, not arbitrary multicolor decoration.

### `typeset` — improve reading and information hierarchy

Tune the existing type scale, line length, line height, weights, wrapping, and vertical rhythm to the surface mode and real content. Preserve text scalability and font licensing. Completion: the reading order is clear across target sizes without clipped, excessively dense, or unstable text.

### `layout` — repair structure and density

Clarify grouping, alignment, content width, whitespace, and the primary-to-secondary relationship. Specify what stacks, collapses, wraps, or scrolls at smaller sizes instead of proportionally shrinking everything. Completion: stable composition at the relevant desktop/mobile or native sizes with representative content.

### `delight` — add useful personality

Choose a small, context-appropriate moment: helpful microcopy, tactile feedback, an expressive empty state, or a purposeful transition. Keep it subordinate to the user's task and compatible with reduced motion and repeat use. Completion: a distinctive detail that provides feedback or meaning rather than friction.

### `overdrive` — make an explicitly ambitious visual pass

Use when the user asks for a stronger creative direction. Make one coherent, high-intent composition rather than accumulating effects. Stay within the contract: refinement still preserves identity, behavior, and copy; a new visual world requires redesign scope. Completion: a pronounced direction that remains usable, performant, and recognizably tied to the product.

## Improve behavior and resilience

### `harden` — handle real use conditions

Address the applicable edge states: long/translated text, empty and dense data, loading and failures, permissions, offline/interruption, keyboard and touch use. Preserve entered work where recovery needs it and make errors actionable. Completion: the specified adverse states remain understandable and recoverable; do not invent backend guarantees.

### `onboard` — guide the first meaningful action

Identify the user's first useful outcome. Explain only what is needed to reach it, ask for permissions at the relevant moment, and use empty states or contextual guidance before imposing a long tour. Respect dismissal and returning-user behavior. Completion: a new user can reach that outcome without blocking experienced users.

### `animate` — make state changes understandable

Name the purpose of each animation: continuity, progress, spatial context, or feedback. Reuse motion tokens, avoid layout-jarring or indefinite decoration, and provide a reduced-motion equivalent. Completion: transitions explain the interaction without delaying it or hiding the resting state.

### `clarify` — make language and feedback precise

Use the product's terminology. Improve ambiguous labels, instructions, errors, confirmation, and status copy; state consequences and feasible next steps. Only change copy within the authorized scope, retaining facts and required legal language. Completion: users can predict the action and understand the result.

### `adapt` — fit another context

Identify the target viewport, device, input method, orientation, text size, or locale. Adapt hierarchy and interaction structure while retaining the product's core task. Use [native guidance](native.md) for platform-specific work. Completion: the target context is deliberately supported, not merely a scaled source layout.

### `optimize` — remove measured interaction cost

Inspect the slow or unstable path the user identified, or measure the requested surface with available runtime tools. Address demonstrated rendering, asset, layout-shift, or interaction bottlenecks while retaining behavior and visual quality. Completion: report the observed before/after signal and scope; do not claim speed gains from source changes alone.

## Host-dependent and manual helpers

These workflows do not install automation. Read [connection and capability guidance](connection.md) when a host integration is involved.

### `live` — collaborate on a running surface

If the host provides authorized browser or simulator control, inspect the target and apply the user's requested visual change, following the same bounded finish gate. A browser session is not provided by Niblet MCP. Without that capability, work from a user-provided screenshot and identified file/screen, or provide specific manual inspection steps. Completion: a concrete change or grounded critique with the source of visual evidence stated. Do not claim automatic selectors, click-to-source mapping, or an ongoing watcher.

### `hooks` — connect a workflow only where the host supports it

Inspect the host's documented hook capability and existing configuration. Explain the intended event, action, and permission boundary before making any explicitly requested configuration change. No hook installer is bundled. Manual alternative: ask the agent to run the finish gate before handoff. Completion: either a verified host-supported configuration or a clear manual workflow, never an invented hook command.

### `doctor` — diagnose the actual integration

Inspect the host's configured transport, local command/absolute path, Node prerequisite, token presence without displaying it, and the observed tool/resource inventory. Distinguish the two-tool remote service from the broader local package. Report the failed boundary and smallest correction. No doctor executable is bundled. Completion: an evidence-backed diagnosis or an explicitly identified missing host capability.

### `pin` / `unpin` — manage a command shortcut

The original helper created or removed standalone command shortcuts. Use a host's documented command-registration mechanism only when available and explicitly requested; no pinning script is bundled. Manual alternative: invoke “Niblet <command> <target>” directly. Completion: a verified shortcut addition/removal or a clear statement that the host requires manual invocation. This helper does not select or pin UI elements.
