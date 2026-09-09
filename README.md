<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/PyModel/niblet-skill-mcp/main/assets/niblet-logo-dark.svg">
    <img alt="Niblet" src="https://raw.githubusercontent.com/PyModel/niblet-skill-mcp/main/assets/niblet-logo-light.svg" width="300">
  </picture>
</p>

<p align="center">Real screen references and a design skill, for coding agents that build UI.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@pymodel/niblet"><img alt="npm" src="https://img.shields.io/npm/v/%40pymodel%2Fniblet?logo=npm&logoColor=white&label=npm&color=e8a33d&labelColor=0f1110"></a>
  <a href="https://www.npmjs.com/package/@pymodel/niblet"><img alt="Downloads" src="https://img.shields.io/npm/dm/%40pymodel%2Fniblet?logo=npm&logoColor=white&label=downloads&color=30363d&labelColor=0f1110"></a>
  <a href="https://nodejs.org"><img alt="Node 24.15+" src="https://img.shields.io/badge/node-24.15%2B-30363d?logo=nodedotjs&logoColor=white&labelColor=0f1110"></a>
  <a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/mcp-server-30363d?logo=anthropic&logoColor=white&labelColor=0f1110"></a>
  <a href="https://github.com/PyModel/niblet-skill-mcp/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/PyModel/niblet-skill-mcp?logo=github&logoColor=white&label=stars&color=30363d&labelColor=0f1110"></a>
  <a href="https://github.com/PyModel/niblet-skill-mcp/blob/main/LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-30363d?labelColor=0f1110"></a>
  <a href="https://hits.sh/github.com/PyModel/niblet-skill-mcp/"><img alt="Visitors" src="https://hits.sh/github.com/PyModel/niblet-skill-mcp.svg?label=visitors&color=30363d&labelColor=0f1110"></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/PyModel/niblet-skill-mcp/main/assets/niblet-mascot.svg" alt="" width="96" height="96">
</p>

<p align="center">
  By <a href="https://github.com/elkaix">elkaix</a> for <a href="https://github.com/PyModel">PyModel</a>
</p>

A coding agent building UI gets two things here: a design skill that keeps it working from your product rather than a generic template, and real screen references from the [Niblet](https://niblet.com) catalogue when a specific visual question is still open.

The skill works alone. The server is optional and needs a token.

## Install the skill

```sh
npx skills add PyModel/niblet-skill-mcp --skill niblet -y
```

Or copy it yourself, keeping `references/`, `agents/`, `LICENSE`, and `NOTICE` alongside it:

```sh
cp -r skill/niblet ~/.claude/skills/niblet
```

Then ask for it by name:

> Use Niblet to design the checkout empty and error states.

The [workflow](skill/niblet/SKILL.md) settles the screen's job, primary action, hierarchy, existing tokens, real states, and acceptance criteria before writing anything. It finishes by rendering the surface and exercising it, so a green build on its own does not count as a pass.

## Connect the server

Pick one. Hosted, if your host speaks HTTP MCP:

```sh
claude mcp add --transport http niblet https://api.niblet.com/mcp \
  --header "Authorization: Bearer $NIBLET_TOKEN"
```

Local over stdio, via the Claude Code CLI:

```sh
claude mcp add niblet --env NIBLET_TOKEN=$NIBLET_TOKEN -- npx -y @pymodel/niblet
```

Or the equivalent in any host's MCP config file:

```json
{
  "mcpServers": {
    "niblet": {
      "command": "npx",
      "args": ["-y", "@pymodel/niblet"],
      "env": { "NIBLET_TOKEN": "<your Niblet API token>" }
    }
  }
}
```

Node.js 24.15+; npx fetches the package on first launch. Get a token from [niblet.com/docs](https://niblet.com/docs) and keep it in your host's environment, never in a committed file or a chat message.

Saving the config does not register the server, so confirm it worked. `niblet_status` reports the configured origins, whether a usable token is present, and whether the API answers:

```
Token:        present (44 characters, not shown).
Documents:    5/5 readable (niblet://skill, …).
API check:    OK
```

## Tools

| Tool | Use it for | Token |
| --- | --- | --- |
| `find_ui_references` | One concrete unresolved question about a layout, state, or interaction. Returns one to three real screens as inline images. | yes |
| `find_ui_materials` | A font, icon, or animated icon role your design system does not already cover. Returns the recorded license with each result. | yes |
| `get_design_reference` | The colours, typography, and components recorded for a web screen you already picked. Pass the `screenId` from a reference, or a pack slug. | yes |
| `niblet_help` | "What can Niblet do?", or choosing between commands. Lists the four surface modes and every command; pass `command` for one entry. | no |
| `niblet_status` | Diagnosing the connection before concluding the catalogue is empty. Never prints the token. | no |

The three catalogue tools match the hosted service exactly. `niblet_help` and `niblet_status` are local-only.

Only web screens carry a design reference, and a web result says so in its own text, so an agent that finds a screen worth borrowing from can read the system behind it in one follow-up call.

## Resources

The bundled documents, served without a token. Cross-links between them are rewritten to these URIs, so an agent reading one can follow every reference.

| URI | Contents |
| --- | --- |
| `niblet://skill` | The design workflow: modes, contract, state coverage, finish gate |
| `niblet://skill/commands` | Every command, its scope, and what completion means |
| `niblet://skill/connection` | Installing, invoking, and diagnosing the tools |
| `niblet://skill/evidence` | When to pull an external reference, and how to use one |
| `niblet://skill/native` | Platform constraints and the native finish gate |

## Configuration

| Variable | Purpose |
| --- | --- |
| `NIBLET_TOKEN` | Required by the two catalogue tools. |
| `NIBLET_API_ORIGIN` | Retarget at a local deployment. Unset for production. |
| `NIBLET_MEDIA_ORIGIN` | Same, for images. Unset for production. |

## Contributing

```sh
git clone https://github.com/PyModel/niblet-skill-mcp
cd niblet-skill-mcp
npm ci --ignore-scripts
cp .env.example .env   # then put your token in NIBLET_TOKEN
npm test
```

`npm test` covers the tool contract and its failure boundaries. For anything touching startup or configuration, also connect a real MCP client and confirm the reported tool list and every `niblet://skill` resource. A resource that registers but never appears in `resources/list` is the failure unit tests cannot catch. For documentation, check that `npm pack --dry-run` still ships what you expect.

[AGENTS.md](AGENTS.md) has the working agreement for pointing a coding agent at this repository.

## License

Apache-2.0, copyright 2026 Mohamed Elkholy (elkaix) and PyModel. See [LICENSE](LICENSE).

The skill carries the same licence; keep [skill/niblet/NOTICE](skill/niblet/NOTICE) with it wherever it is installed.
