# Niblet connection and capability guide

## Standalone skill

Install or make available the entire `skill/niblet` directory in the host's documented skill location, retaining `SKILL.md` and its `references` directory. Hosts use different installation paths and invocation syntax; follow the host's supported mechanism rather than inventing one.

The skill can work from the repository, product brief, and supplied screenshots without MCP. The public catalogue is [https://niblet.com](https://niblet.com). Browser inspection, native simulator access, hook execution, and element selection come from the host, not from this skill or the Niblet API.

## Local stdio MCP package

Prerequisite: Node.js **24.15 or later**. The adapter's bundled documents, `niblet_help`, and `niblet_status` work without a token. Its three catalogue tools call the configured REST `/v1` API and therefore need that deployment's **operator token**. A public `niblet_at_…` account key authenticates the hosted MCP endpoint instead; `/v1` rejects it.

The shortest local configuration uses the published package:

- **Command:** `npx`
- **Arguments:** `-y`, `@pymodel/niblet`
- **Environment:** none for bundled documents and local helpers

For a host using the common `mcpServers` JSON configuration shape:

```json
{
  "mcpServers": {
    "niblet": {
      "command": "npx",
      "args": ["-y", "@pymodel/niblet"]
    }
  }
}
```

Adapt the shape to the host's documented configuration. The bundled `mcp.json` contains this token-free template; it does not load `.env`.

For catalogue access against a self-hosted deployment, add `NIBLET_TOKEN` with that deployment's operator token plus `NIBLET_API_ORIGIN` and `NIBLET_MEDIA_ORIGIN`. Prefer a host-managed secret/environment facility and keep tokens out of commits, screenshots, queries, and chat. From a source checkout, a manual environment-file launch is `node --env-file=/absolute/path/to/private.env src/index.mjs`; plain `npm start` only inherits its process environment.

Public catalogue access should use the hosted MCP endpoint with an account key created at `https://www.niblet.com/account`; do not put that account key in this adapter's `NIBLET_TOKEN`.

The package contacts `https://api.niblet.com` by default, or the HTTP(S) origin in `NIBLET_API_ORIGIN`. It sends the token as bearer authentication for API requests, and never to the media origin. `NIBLET_TOKEN` configures this local adapter; it is not automatically a remote HTTP client's authentication setting.

After the host starts the entry, inspect its observed tool, resource, and prompt inventory. A saved configuration is not proof of a connection. `niblet://skill` and the four `niblet://skill/{commands,connection,evidence,native}` resources return the bundled documents without a token. The local adapter also registers every playbook entry as an MCP prompt named `niblet-<command>`. Catalogue calls require the operator token described above.

### Tool inputs

Tool arguments use **`query`**, not `q`. The adapter translates `query` to the REST API's `q` query parameter. Omitted optional fields use the defaults below.

| Tool | Required arguments | Optional arguments | Returned data |
| --- | --- | --- | --- |
| `find_ui_references` | `query`: string, 1–240 characters | `platform`: `ios` or `web`; `limit`: integer 1–3, default 2; `selectedIds`: one to three screen IDs, each 1–160 characters; `clientSkillVersion`: string, 1–64 characters | Human-readable reference lines and images in `content`; typed references in `structuredContent` |
| `find_ui_materials` | `query`: string, 1–240 characters; `kind`: `font`, `icon`, `animated_icon`, or `pack` | `platform`: `ios` or `web`; `limit`: integer 1–3, default 2; `selectedId`: string, 1–160 characters; `userConfirmed`: `true`; `clientSkillVersion`: string, 1–64 characters | Human-readable materials in `content`; typed name, license, description, and URL records in `structuredContent` |
| `get_design_reference` | one of `screenId` (from a reference) or `packSlug` | `sections`: one or more of `overview`, `colors`, `typography`, `components`, `provenance`; `clientSkillVersion`: string, 1–64 characters | The requested markdown in `content`; typed slug, name, theme, markdown, and returned section names in `structuredContent` |

Without `selectedIds`, `find_ui_references` searches and attaches thumbnail images. With `selectedIds`, it reads those exact screens and attaches inspection-quality images; an ID the catalogue does not hold is skipped rather than failing the call. `query` is required in both cases.

`kind: "pack"` returns a plain refusal before any request: this deployment supplies no packs. `selectedId` and `userConfirmed` are accepted compatibility fields; they do not establish asset installation, pack access, or extra automation. Calls made from this bundled skill pass the `metadata.version` from `SKILL.md` as `clientSkillVersion`; the shared schema defaults to that version when a caller omits it.

Screen IDs are nonempty strings up to 160 characters. They reject dot segments, slash, backslash, percent characters, control characters, and malformed Unicode. Use IDs returned by a previous search rather than deriving them from display names. The client URL-encodes accepted identifiers.

Only web screens belong to a design pack. A web search says so in its own text; call `get_design_reference` with that screen's ID to read the system behind it. Pass `sections` when only part of the reference is relevant; omit it for the complete document. An iOS screen returns a plain "Only web screens have one" rather than an error, so treat a missing reference as an answer and continue from the local design system.

Empty results are ordinary text, not failures: `find_ui_references` returns "No relevant references. Continue with the product brief and existing design system." and `find_ui_materials` returns "No <kind> materials matched." Continue from local evidence in both cases.

Example tool arguments:

```json
{
  "query": "subscription settings with clear renewal status",
  "platform": "ios",
  "limit": 3
}
```

```json
{
  "query": "outlined navigation icons",
  "kind": "icon",
  "limit": 3
}
```

Images arrive as MCP image content, fetched only from the configured media origin (`https://media.niblet.com` by default, or `NIBLET_MEDIA_ORIGIN`) and the API origin, without the token. A URL on any other host is never fetched. An image that fails, redirects, is not an image type, or exceeds 2 MiB is skipped and the text reference stands alone; text-only output is not visual inspection.

### Local failure boundaries

The adapter rejects redirects, bounds requests to 15 seconds, and caps decoded responses at 2 MiB. It does not retry. An authentication, timeout, HTTP, or response-size error is a failed retrieval, not an empty catalogue result. Correct a documented configuration problem if possible, otherwise continue with local evidence and state any limitation material to the user's request. Do not expose the token while diagnosing failures.

## Existing remote MCP service

For a host that supports the deployed remote HTTP MCP transport, the endpoint is:

`https://api.niblet.com/mcp`

Configure it through that host's supported remote connection and authentication mechanism. Do not substitute this URL into a stdio `command` field, and do not assume that a host can connect to remote MCP merely because it supports local processes.

This existing remote service exposes **only**:

- `find_ui_references`
- `find_ui_materials`
- `get_design_reference`

Its schemas match the local adapter. Both require `query` (1–240 characters), accept `limit` from 1–3 with default 2, and accept optional `platform` (`ios` or `web`). Materials also require `kind` (`font`, `icon`, `animated_icon`, or `pack`); neither deployment supplies packs.

For exact reference inspection, both deployments accept `selectedIds`: one to three screen IDs, each 1–160 characters; `query` is still required. Both attempt to include images, and an individual image fetch can fail. Do not claim visual inspection from text-only results.

All three schemas accept `clientSkillVersion` (1–64 characters) and default it to the current bundled skill version. `get_design_reference` accepts a unique, nonempty `sections` subset of `overview`, `colors`, `typography`, `components`, and `provenance`. The materials schema also accepts `selectedId` (1–160 characters) and `userConfirmed: true`; those two fields do not establish asset installation, pack access, or extra automation. Read the connected tool's actual schema before calling it.

The remote service does not promise the `niblet://skill` resource. Neither deployment offers `review_ui` or any hosted UI review service, nor catalogue-detail tools such as app, journey, or statistics listings.

## Capability checks and manual alternatives

| Requested helper | Capability to inspect | Honest alternative |
| --- | --- | --- |
| `doctor` | Host connection state, runtime/path configuration, token presence, tool inventory | Explain the observed failed boundary and the needed configuration change; no bundled diagnostic executable |
| `hooks` | Host-specific hook API and existing event configuration | Invoke the finish gate manually before handoff; no bundled hook installer |
| `pin` / `unpin` | Host's documented command-shortcut registration | Invoke “Niblet <command> <target>” directly; no bundled shortcut installer |
| `live` | Authorized browser/simulator session and available interaction tools | Work from supplied screenshots and targeted manual inspection; no bundled browser service or watcher |

The full task instructions for these helpers are in [the command playbook](commands.md). Confirm capabilities through real host results, not inferred availability from a command name.
