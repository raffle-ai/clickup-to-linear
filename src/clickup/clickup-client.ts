import pMap from "p-map";
import { z } from "zod";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { orderBy } from "es-toolkit";

import listData from "~/input/lists.json";
import {
  parseRawTicket,
  taskListResponseSchema,
  type InputTicket,
} from "./tasks-parsing";
import {
  commentsResponseSchema,
  processComment,
  type ProcessedComment,
} from "./comments-parsing";
import { extractSprintNumber } from "./utils";

const fetch = NodeFetchCache.create({
  shouldCacheResponse: (response) => response.ok,
  cache: new FileSystemCache({
    cacheDirectory: "./.cache",
    ttl: 12 * 60 * 60 * 1000, // 12 hours
  }),
});

const lists = z
  .array(z.object({ name: z.string(), id: z.string() }))
  .parse(listData);

export type TaskWithComments = InputTicket & { comments: ProcessedComment[] };

export function createClickUpClient() {
  const token = process.env.CLICKUP_API_KEY;
  const rootURL = "https://api.clickup.com/api/v2";

  function request(endPoint: string) {
    if (!token) {
      throw new Error("Missing CLICKUP_API_KEY");
    }
    const url = `${rootURL}/${endPoint}`;
    console.log("Fetching", url);

    return fetch(url, {
      headers: {
        Authorization: token,
      },
    }).then((res) => res.json());
  }

  async function getTasksByList(listId: string, page: number) {
    const response = await request(
      `list/${listId}/task?include_closed=true&subtasks=true&page=${page}`
    );
    return taskListResponseSchema.parse(response).tasks;
  }

  async function getComments(taskId: string) {
    const response = await request(`task/${taskId}/comment`);
    return commentsResponseSchema.parse(response).comments;
  }

  async function getTasksAndCommentByList(
    list: string,
    {
      id,
      page,
      limit,
    }: {
      limit: number;
      page: number;
      id?: string;
    }
  ) {
    const listId = getListIdByName(list);
    const allTasks = await getTasksByList(listId, page);
    if (!allTasks.length) {
      throw new Error(`No task not found ${JSON.stringify({ list, id })}`);
    }

    const tasksToProcess = limit ? allTasks.slice(0, limit) : allTasks;

    const tasks = tasksToProcess.map(parseRawTicket);

    const tasksWithComments: TaskWithComments[] = await pMap(
      tasks,
      async (task) => {
        const rawComments = await getComments(task.id);
        const comments = rawComments.map(processComment);
        return { ...task, comments };
      },
      { concurrency: 1 }
    );

    // Sort by parent first as we want to process parents first, setting up the map of ID needed when creating sub issues
    return orderBy(
      tasksWithComments,
      [(task) => (task.parentId ? 1 : 0)],
      ["asc"]
    );
  }

  return {
    getTasksAndCommentByList,
  };
}

function getListIdByName(listName: string) {
  const list = lists.find(
    (list) => extractSprintNumber(list.name) === listName
  );
  if (!list) {
    throw new Error(`List not found: ${listName}`);
  }
  return list.id;
}
