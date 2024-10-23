# ClickUp to Linear Migration

A CLI app in TypeScript to migration from ClickUp to Linear.app

### Requirements

Install [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Install dependencies

```bash
bun install
```

To run:

```bash
bun run index.ts
```

### Setup

Create a Linear API key from Linear.app

Create a `.env` file with the following secrets:

- LINEAR_API_KEY
- TEAM_KEY

### Generate setup files

#### Users

```sh
bun run api-cli.ts users > setup/users.json
```

#### Labels

```
bun run api-cli.ts labels > setup/labels1.json
```
