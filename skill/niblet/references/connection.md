# Niblet connection and capability guide

## Standalone skill

Install or make available the entire `skill/niblet` directory in the host's documented skill location, retaining `SKILL.md` and its `references` directory. Hosts use different installation paths and invocation syntax; follow the host's supported mechanism rather than inventing one.

The skill can work from the repository, product brief, and supplied screenshots without MCP. The public catalogue is [https://niblet.com](https://niblet.com). Browser inspection, native simulator access, hook execution, and element selection come from the host, not from this skill or the Niblet API.

## Local stdio MCP package

Prerequisites: Node.js **24.15 or later**, this package with its dependencies installed, and a Niblet API key (`niblet_at_…`, created at `https://www.niblet.com/account`) for catalogue tool calls. The client launches the process locally and communicates over stdio; it is not a local HTTP service.

From the package root, run `npm ci --ignore-scripts` to install the locked dependencies. Then configure the MCP host below; it launches the server itself. To run manually with an environment file, use `node --env-file=/absolute/path/to/private.env src/index.mjs`. Plain `npm start` inherits the process environment and does not automatically load `.env`.

Configure the host's stdio MCP entry with:

- **Command:** `node`
- **Arguments:** `/absolute/path/niblet-mcp/src/index.mjs`
- **Environment:** `NIBLET_TOKEN` containing the API token; optionally `NIBLET_API_ORIGIN` and `NIBLET_MEDIA_ORIGIN` to target a non-production deployment

For a host using the common `mcpServers` JSON configuration shape:

```json
{
  "mcpServers": {
    "niblet": {
      "command": "node",
      "args": ["/absolute/path/niblet-mcp/src/index.mjs"],
      "env": {
        "NIBLET_TOKEN": "<your Niblet API token>"
      }
    }
  }
}
```

Replace the absolute path and token placeholder locally. Adapt the shape to the host's documented configuration if it differs. Prefer a host-managed secret/environment facility where supported; keep tokens out of repository commits, screenshots, queries, and chat. A token is a prerequisite, not something this package creates: the person creates one for themselves at `https://www.niblet.com/sign-up`, confirms the six-digit code emailed to them, and then creates keys at `https://www.niblet.com/account`. The key's plaintext is shown once, at creation, and can be revoked from the same page.

The bundled `mcp.json` is a template: replace both `/absolute/path/to/niblet-skill-mcp/...` placeholders with the real checkout path. It loads an optional `.env` beside the package, so copy `.env.example` to `.env` and supply the token privately, or set `NIBLET_TOKEN` in the host environment. Plain `npm start` still only inherits its environment.

The package contacts `https://api.niblet.com` by default, or the HTTP(S) origin in `NIBLET_API_ORIGIN`. It sends the token as bearer authentication for API requests, and never to the media origin. `NIBLET_TOKEN` configures this local adapter; it is not automatically a remote HTTP client's authentication setting.

After the host starts the entry, inspect its observed tool/resource inventory. A saved configuration is not proof of a connection. The `niblet://skill` resource returns the bundled `SKILL.md` and does not require the token; it is not a resource tree serving all referenced documents. Install the skill directory for access to those references. Catalogue calls require the token.

### Tool inputs

Tool arguments use **`query`**, not `q`. The adapter translates `query` to the REST API's `q` query parameter. Omitted optional fields use the defaults below.

| Tool | Required arguments | Optional arguments | Returned data |
| --- | --- | --- | --- |
| `find_ui_references` | `query`: string, 1–240 characters | `platform`: `ios` or `web`; `limit`: integer 1–3, default 2; `selectedIds`: one to three screen IDs, each 1–160 characters; `clientSkillVersion`: string, 1–64 characters | Reference lines with app, screen type, platform, pixel size, ID, summary, and inspect URL, plus one inline image per reference |
| `find_ui_materials` | `query`: string, 1–240 characters; `kind`: `font`, `icon`, `animated_icon`, or `pack` | `platform`: `ios` or `web`; `limit`: integer 1–3, default 2; `selectedId`: string, 1–160 characters; `userConfirmed`: `true`; `clientSkillVersion`: string, 1–64 characters | Numbered materials with name, recorded license, description, and URL |
| `get_design_reference` | one of `screenId` (from a reference) or `packSlug` | `clientSkillVersion`: string, 1–64 characters | The pack's style reference as markdown: colours with their roles, typography, and component inventory |

Without `selectedIds`, `find_ui_references` searches and attaches thumbnail images. With `selectedIds`, it reads those exact screens and attaches inspection-quality images; an ID the catalogue does not hold is skipped rather than failing the call. `query` is required in both cases.

`kind: "pack"` returns a plain refusal before any request: this deployment supplies no packs. `selectedId`, `userConfirmed`, and `clientSkillVersion` are accepted compatibility fields; they do not establish asset installation, pack access, or extra automation.

Screen IDs are nonempty strings up to 160 characters. They reject dot segments, slash, backslash, percent characters, control characters, and malformed Unicode. Use IDs returned by a previous search rather than deriving them from display names. The client URL-encodes accepted identifiers.

Only web screens belong to a design pack. A web search says so in its own text; call `get_design_reference` with that screen's ID to read the system behind it. An iOS screen returns a plain "Only web screens have one" rather than an error, so treat a missing reference as an answer and continue from the local design system.

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

Both schemas also accept `clientSkillVersion` (1–64 characters); the materials schema accepts `selectedId` (1–160 characters) and `userConfirmed: true`. These compatibility fields do not establish asset installation, pack access, or extra automation. Read the connected tool's actual schema before calling it.

The remote service does not promise the `niblet://skill` resource. Neither deployment offers `review_ui` or any hosted UI review service, nor catalogue-detail tools such as app, journey, or statistics listings.

## Capability checks and manual alternatives

| Requested helper | Capability to inspect | Honest alternative |
| --- | --- | --- |
| `doctor` | Host connection state, runtime/path configuration, token presence, tool inventory | Explain the observed failed boundary and the needed configuration change; no bundled diagnostic executable |
| `hooks` | Host-specific hook API and existing event configuration | Invoke the finish gate manually before handoff; no bundled hook installer |
| `pin` / `unpin` | Host's documented command-shortcut registration | Invoke “Niblet <command> <target>” directly; no bundled shortcut installer |
| `live` | Authorized browser/simulator session and available interaction tools | Work from supplied screenshots and targeted manual inspection; no bundled browser service or watcher |

The full task instructions for these helpers are in [the command playbook](commands.md). Confirm capabilities through real host results, not inferred availability from a command name.
