# ClickUp to Linear migration scripts

A CLI app written in TypeScript to migrate _tasks_ created in ClickUp to Linear _issues_, using ClickUp REST API and Linear SDK.

## Overview

There are two entry-points to launch the CLI apps using Bun runtime:

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

We use [Bun](https://bun.sh) to manage dependencies and run TypeScript without compilation step. Install it on your machine.

Install project dependencies, from the repo root level:

```bash
bun install
```

## Setup

### Credentials

Create a Linear API key from Linear.app settings page

Copy `.env.template` content and create a `.env` file at the root level, setting up the Linear and ClickUp API keys.

### Setup lists from ClickUp

ClickUp tasks are migrated calling the `/tasks` end-point that expects a listId.

Doc: https://clickup.com/api/clickupreference/operation/GetTasks/

So first we need to grab list data and generate a file `/input/lists.json` file.

To get the lists, you need the folderId. To get the folderId, you need the spaceId.

So you need to call 3 different end-points from ClickUp API:

- Spaces: https://api.clickup.com/api/v2/team/{team_id}/space?archived=false
- Folders: 'https://api.clickup.com/api/v2/space/{space_id}/folder?archived=false
- Lists: https://api.clickup.com/api/v2/folder/{folder_id}/list?archived=false

The team_id appears in the ClickUp default URL: https://app.clickup.com/{team_id}/home

_NOTE:_
If you use zsh you need to export the .env for the requests to run

```bash
export $(grep -v '^#' .env | xargs)
```

And then (example for Folders):

```bash
curl -H "Authorization: $CLICKUP_API_KEY" "https://api.clickup.com/api/v2/space/{space_id}/folder?archived=false"
```

Grap the array of folders from the API response and create `input/lists.json`, it should have the following structure (keeping only the relevant fields):

```json
[
  {
    "id": "900700987281",
    "name": "Backlog"
  },
  {
    "id": "901803072724",
    "name": "Sprint 40 (9/9/24 - 22/9/24)"
  }
]
```

### Setup teamId and projectId from Linear

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

From the team settings page, adjust the different available states (by default: Backlog, Todo, In Progress, Done, Canceled)

```sh
bun run ./src/cli-setup.ts states > setup/states.json
```

## Running the migration

Because of the Linear API rate limit (1500 calls per hour), I migrated the sprints one by one.

Run the CLI script in `dryRun` mode to ensure it works as expected before running it for real!

```sh
bun run ./src/cli-migrate.ts 40 --dryRun
```

_NOTE:_
In this edited version of the repository we don't use sprints as the number.
Instead, the order of the lists in lists.json determine the number (i.e: 0 is the first, 1 is the second)

If one sprint has a lot of tasks (+100), you will need to run the script page by page. Specify the flag `--page 1` to access the second "page" of tasks.

When debugging, a `--limit` flag can be used to only process a given number of tasks.

An optional flag `--id` can be used to only process a single task, specified by its ID (e.g., `--id 86eqek0y4`). It has to be a top-level task, not a sub-task.

## Linear API rate limits

The Linear API is limited to 1500 calls per hour, and it's very easy to hit the limit because one single task to migrate results in at least 2 API calls:

- one call to create the issue
- another call to archive the issue

Each comment adds another call.
Repeat for every sub-task, and you hit the wall!

Control how many calls are available by calling

```sh
bun run src/cli-setup.ts rate-limit
```
