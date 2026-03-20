# local-context-mcp

[日本語](README.md) English

`local-context-mcp` is a small project built as a practice MCP server implementation.
It provides tools that may be useful for sharing the current local context between an AI and a user, assuming they are in the same environment.

## Features
- A locally running MCP server
- Tools for sharing the current date and time, assuming the AI and user are in the same place
- GeoIP-based location data is only for supplementary use. It may be unavailable, and even when available it can be significantly inaccurate at the country or city level

### `when-is-now`
- Returns the current date and time in ISO 8601 format
- Resolves the time zone in this order: `TZ`, GeoIP cache-backed auto-detection, then the local environment
- The response also includes the resolved time zone name
- GeoIP-based auto-detection can fail, and the estimated result may be significantly wrong. If you need certainty, explicitly set `TZ`
- See [`docs/auto-tz.md`](docs/auto-tz.md) for details on auto-tz
- See [`docs/tools/when-is-now.md`](docs/tools/when-is-now.md) for details

### `where-are-we`
- Returns a coarse location string derived from GeoIP information
- The returned value is a rough expression such as `Tokyo, Tokyo-to` or `Tokyo, JP`, designed to be easy for an LLM to use as context
- The location string is assembled from available `city`, `region`, and `country` fields in priority order
- Empty strings or whitespace-only values are ignored, and duplicate values are removed when possible to keep the result simple
- GeoIP location may be unavailable, and even when available it can be significantly inaccurate at the country or city level
- See [`docs/tools/where-are-we.md`](docs/tools/where-are-we.md) for details

## Use From LM Studio via Docker

See [`docs/docker.md`](docs/docker.md) for the full behavior and configuration details.

### Prerequisites
- Build the Docker image

```bash
npm run docker:build
```

### Example Configuration
- Add the following to the LM Studio MCP server settings

```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "obaratch/local-context-mcp-server"]
    }
  }
}
```

- If needed, you can explicitly set the time zone by adding `-e TZ=Asia/Tokyo` to `args`
- If you want to reuse the auto-tz GeoIP cache, add a named volume
- GeoIP-based location or time zone estimation is not guaranteed to accurately represent the MCP client's actual location. Assume it can be unavailable or substantially wrong

### Check
- After connecting, confirm that the following tools are visible in `tools/list`
  - `when-is-now`
  - `where-are-we`

### Example Configuration With Persistent Cache
```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--mount",
        "source=local-context-store,target=/data",
        "obaratch/local-context-mcp-server"
      ]
    }
  }
}
```

- In this setup, the store and GeoIP cache are saved in the Docker-managed named volume `local-context-store`
- Because the named volume is managed by Docker, you do not need to create a fixed directory on the host
- See [`docs/docker.md`](docs/docker.md) and [`docs/store.md`](docs/store.md) for details
