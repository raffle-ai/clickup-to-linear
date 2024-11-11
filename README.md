# ClickUp to Linear migration scripts

A CLI app written in TypeScript to migrate _tasks_ created in ClickUp to Linear _issues_.

## Overview

There are two entry-points to launch the CLI apps using Bun runtime.

- The `cli-setup` CLI is used to interact with the Linear API and generate JSON files that will be used later when performing the actual migration.
- The `cli-migrate` CLI gets tasks for a given sprint from ClickUp API and generate the issues, sub issues and comments in Linear.

Use the `--help` flag to see the available commands:

```sh
bun run ./src/cli-setup.ts --help
```

The migration script takes a sprint number as a parameter add uses `dryRun` to simulate the migration safely.

```sh
bun run ./src/cli-migrate.ts 39 --dryRun
```

## Requirements

Install [Bun](https://bun.sh)

Install project dependencies:

```bash
bun install
```

## Setup

### Credentials

Create a Linear API key from Linear.app settings page

Copy `.env.template` content and create a `.env` file at the root level, setting up the Linear and ClickUp API keys.

### Setup teamId and projectId

Run the command line to grab the `id` of your team and your project:

```sh
bun run src/cli-setup.ts teams
```

```sh
bun run src/cli-setup.ts projects
```

Update the `.env` file with the following keys:

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

From the team settings page, adjust the different available states (by default: Backlog, Todo, In Progress, Done, Cancelesd)

```sh
bun run ./src/cli-setup.ts states > setup/states.json
```

## Running the migration

Because of the Linear API rate limit (1500 calls by hours) I migrated the sprints one by one

Run the CLI script in `dryMode` to ensure it works as expected before running it for real!

```sh
bun run ./src/cli-migrate.ts 40 --dryRun
```

If one sprint has a lot of tasks (+100), you will need to run the script page by page, specify the flag `--page 1` to access the second "page" of tasks.

When debugger, a `--limit` flag can be used to only process a given number of rows.

An optional flag `--id` can be used to only process a Click Task by ID. It has to be a top level taks, not a sub task.

## Linear API rate limits

The Linear API is limited to 1500 calls per hour and it's very easy to hit the limit because one single task to migrate results in at least 2 API calls:

- one call to create the issue
- another call to archive the issue

Each comment adds another call.
Repeat for every sub-task and you hit the wall!

Control how many calls are available by calling `bun run src/cli-setup.ts rate-limit`
