import pMap from "p-map";
import { z } from "zod";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";

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
    ttl: 60 * 60 * 1000, // 1 hour
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

  async function getTasksByList(listId: string) {
    const response = await request(`list/${listId}/task?include_closed=true`);
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
      limit,
    }: {
      limit: number;
      id?: string;
    }
  ) {
    const listId = getListIdByName(list);
    const allTasks = await getTasksByList(listId);
    const foundTasks = id
      ? allTasks.filter((task) => task.id === id)
      : allTasks;
    if (!foundTasks.length) {
      throw new Error(`No task not found ${JSON.stringify({ list, id })}`);
    }

    const tasksToProcess = limit ? foundTasks.slice(0, limit) : foundTasks;

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

    return tasksWithComments;
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
