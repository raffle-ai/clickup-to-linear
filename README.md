# ClickUp to Linear Migration

A CLI app written in TypeScript to migrate _tasks_ created in ClickUp to Linear _issues_.

## Overview

There are two entry-points to launch the CLI apps using Bun runtime.

- The "setup" CLI is used to interact with the Linear API and generate JSON files that will be used later when performing the actual migration.
- The import CLI takes a CSV file as a parameter and creates the issues in Linear

```sh
bun run ./src/cli-setup.ts --help
```

```sh
bun run ./src/cli-import.ts input.csv --dryRun
```

## Requirements

Install [Bun](https://bun.sh)

Install project dependencies:

```bash
bun install
```

## Setup

### Credentials

Create a Linear API key from Linear.app

Copy `.env.template` content and create a `.env` file with the following secrets:

- LINEAR_API_KEY
- TEAM_KEY
- PROJECT_KEY

### Generate setup files

We need to query Linear.app to generate some JSON files in the `./setup` folder

#### Users

```sh
bun run ./src/cli-setup users > setup/users.json
```

#### Labels

```sh
bun run ./src/cli-setup.ts labels > setup/labels.json
```

#### States

```sh
bun run ./src/cli-setup.ts states > setup/states.json
```

## Running the migration

TODO: describe how to generate the CSV file from a ClickUp view.

Move the CSV file to the `input` folder pf this repo.

Run the CLI script in `dryMode` to ensure it works as expected before running it for real!

```sh
bun run ./src/cli-import.ts input/clickup.csv --dryRun
```

When debugger, a `--limit` flag can be used to only process a given number of rows.
