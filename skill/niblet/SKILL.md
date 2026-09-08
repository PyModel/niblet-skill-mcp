---
name: niblet
description: Keep interface work anchored to the product it belongs to instead of a generic template. Sets a short design contract, builds from the components and tokens already in the codebase, covers the states a surface can actually reach, and closes by looking at the rendered result. Use when building, reworking, or assessing a web or native interface. Trigger with "niblet", "niblet skill", "niblet designer ui", or "niblet review". Skip backend, CLI, data, and infrastructure work, prose-only tasks, and questions the product's own design system already settles.
license: Apache-2.0
metadata:
  version: "0.1.0"
  author: "Mohamed Elkholy (elkaix)"
  organization: "PyModel"
  source: "https://github.com/PyModel/niblet-skill-mcp"
  compatibility: "Claude Code, Codex, Cursor, and GitHub Copilot, or any agent that can open repository files and call an MCP tool."
  tags: "interface-design, product-ui, design-contract, state-coverage, accessibility, native"
---

# Niblet

Build an interface that belongs to this product, not a generic template. [Niblet](https://niblet.com) is an optional reference catalogue; this skill also works entirely from local product evidence without an MCP connection, account, script, or browser automation.

## Start here

1. Identify the requested surface, action, and scope. Read the product brief, relevant current screens, components, tokens, content, and platform constraints. Inspect the repository directly; this skill has no setup script.
2. Select the surface mode below and write a compact design contract in the conversation or the existing surface brief. Ask only for a consequential decision that the available product evidence cannot answer. Mark other assumptions.
3. Read [the command playbook](references/commands.md) for the requested command. Commands are agent work instructions, not bundled executables or guaranteed slash-command registrations. For native work, also read [native guidance](references/native.md).
4. Work within the contract. Use existing components and tokens before introducing new ones. If a concrete visual question remains unresolved, follow [the evidence policy](references/evidence.md); reference retrieval is optional, never a prerequisite to useful work.
5. Cover the applicable states and run the bounded finish gate. Report the delivered scope, evidence actually inspected, and any specific verification limitation.

**Routing:** with no target or command, present a short context-aware menu and wait for a choice rather than making changes. An explicit command loads its playbook entry. Otherwise treat the request as ordinary design work. For a new surface or replacement visual world without product context, run `init` first; narrow refinements can proceed from the incumbent implementation. `craft` aliases ordinary new work; `teach` aliases `init`.

**Authority order:** the user's current requirements and product brief; established product behavior, content, components, and design system; native platform and accessibility constraints; this skill; external references. Aesthetic preferences never overrule product truth, accessibility, or functional requirements.

## Four modes

Choose by the job of each surface, not the repository's category. Different surfaces in one product may use different modes. Persist the choice only in that surface's brief when persistence is requested; do not impose a project-wide mode.

| Mode | User's job | Design priority | Common surfaces |
| --- | --- | --- | --- |
| **Persuade** | Decide and act | Make the proposition, evidence, trade-offs, and next action understandable | Marketing, pricing, acquisition |
| **Operate** | Complete a task | Legible state, efficient controls, predictable navigation, and recovery | Apps, dashboards, settings, native utilities |
| **Read** | Understand | Comprehension, typography, reading rhythm, navigation, and useful examples | Documentation, articles, guides |
| **Experience** | Engage with the work itself | Let the artifact lead; keep navigation and chrome subordinate but usable | Portfolios, galleries, interactive work |

Mode is a prioritization tool, not a visual preset. A pricing page still needs usable controls; a gallery still needs accessible navigation; an application can have character without obscuring its tasks.

## Design contract

Keep this short enough to guide implementation. Record:

- **Surface and mode:** route, component, or native screen; intended user; task and primary action.
- **Scope:** new work, refinement, or redesign; files/flows in scope and explicit exclusions.
- **Product authority:** brief, local components/tokens, content, and platform rules being followed.
- **Identity:** the hierarchy, density, typography, color roles, imagery, and interaction character appropriate to this product. Identify one or two concrete distinguishing decisions, not a list of fashionable adjectives.
- **Reading order:** rank what the user must understand first, second, and next; identify which supporting details can wait. Name the existing components and semantic tokens that express this hierarchy.
- **Behavior and states:** critical interaction, applicable state matrix, responsive/native adaptations, accessibility requirements, and real data constraints.
- **Evidence and acceptance:** any unresolved reference question; what a rendered result must visibly demonstrate; available device/browser and remaining limitations.

For **refinement**, preserve identity, behavior, copy, and out-of-scope areas unless the request expressly changes them. For **redesign**, replace the visual direction coherently while retaining product facts, required functionality, and native constraints. Neither scope authorizes unrelated feature work.

## Slop checks

Make the product's task recognizable from the rendered screen, not just its logo. Apply these checks within the target product's established language:

- Use real objects, labels, and content density. Metrics need a real source; empty states explain what is missing and what to do next. Do not fill a dashboard with invented activity.
- Give the primary action a clear consequence and dominant position; subordinate secondary actions without hiding essential navigation.
- Group content by the user's decision or workflow. A grid is appropriate for comparing screens or products, not a default container for unrelated facts.
- Reuse semantic surface, text, border, action, and status tokens. Add a primitive only when existing components cannot express the task; record why in the contract.
- Let useful content carry visual interest. New gradients, glow, glass, nested cards, oversized headings, and motion need a product or interaction purpose. Preserve established brand assets and effects during refinement rather than enforcing a universal ban.
- Check the substitution test: if another product's name could replace this one without changing the content or structure, identify the missing product-specific decision and correct it.

For Niblet's own site, follow its current design contract and source components: Plus Jakarta Sans, `ground`/`tile`/`sheet` surfaces, `ink`/`muted` text, the blue `accent`, real screen tiles, and existing mascot assets. Do not import a reference site's font, palette, or button treatment. For other products, their own system takes precedence over these Niblet-specific choices.

## Required state coverage

For each changed interactive surface, determine which states can actually occur. Implement those in scope; identify deliberate exclusions rather than inventing meaningless variants.

- Initial and populated content; loading or pending feedback when work is asynchronous.
- Empty data and empty search/filter results, with an appropriate next step.
- Validation and service errors, with retained input and a feasible recovery path.
- Success, selected/active, disabled, and submitting states when the control supports them.
- Keyboard focus and hover where applicable; touch feedback; labels and status announcements that do not depend on color alone.
- Long text, larger text, narrow/wide layouts, overflowing lists, and representative content density.
- Offline, permission denied, destructive confirmation/undo, and interrupted work when the flow can encounter them.

A control must perform its advertised action. Clearly label prototype-only behavior when the user requested a prototype; do not disguise missing implementation as a successful state.

## Bounded rendered finish gate

Agree on acceptance in the contract, then inspect the actual surface rather than scoring its source code.

1. **Inspect once, batched.** For web work, render the relevant desktop and mobile layouts together and exercise the changed primary interaction plus its most consequential alternate state. For native work, use the relevant device class and platform-specific checks in the native guidance. Inspect representative states already identified in the contract rather than every theoretical combination.
2. **Fix observed blockers.** In one focused pass, correct clipping and overlap, a hierarchy that misleads, stretched or cropped imagery, controls an assistive user cannot reach, focus and navigation that break, layout that shifts under load, and actions that do nothing. Include interchangeable filler or unsupported metrics when they violate the contract. Keep corrections within scope.
3. **Confirm the corrections.** Revisit affected states after fixes and report the observed result. Pass only when the contract is met. A verification limit is not a pass: report blocked or unexercised checks explicitly. Avoid open-ended cosmetic iteration, but do not stop with an actionable in-scope blocker merely because one pass elapsed.

Also check semantic controls, meaningful names, usable contrast, focus visibility, touch targets, reduced-motion behavior, and the relevant zoom/text-size behavior. A screenshot supports visual claims, not interaction or assistive-technology claims that were not exercised.

If rendering is unavailable, inspect the reachable implementation and report exactly what could not be rendered or exercised. A manual inspection checklist can support the handoff but does not turn an unobserved result into a rendered pass. Source checks or a successful build alone are not visual proof.

## Optional connection and helpers

Read [the connection guide](references/connection.md) when installing or invoking MCP tools, diagnosing a connection, or using host-dependent helpers. The local package exposes catalogue tools and the `niblet://skill` resource; the existing remote endpoint exposes only two search tools. Neither service implements UI review, hooks, element pinning, selector discovery, or live browser control.

The command playbook includes manual alternatives for `live`, `hooks`, `doctor`, and `pin`. State which host capability was actually used. Do not claim that a prompt created automation or that an MCP connection exists without an observed host result.
