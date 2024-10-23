import { z } from "zod";

import labelData from "../setup/labels.json";
const labels: readonly string[] = labelData.map((label) => label.name);

const statuses = [
  "done",
  "to do",
  "parked",
  "in review",
  "rejected",
  "in progress",
] as const;

const priorities = [
  "Must Have | 必須",
  "Should Have | 取り組むべき",
  "Could Have | できたら取り組む",
  "Won't Have",
] as const;

export const rowSchema = z.object({
  ["Task Custom ID"]: z.string().startsWith("POC"),
  ["Task Name"]: z.string().min(1),
  ["Task Content"]: z.string().trim(),
  ["Time Estimated"]: z.string(),
  ["Date Created"]: z.string().min(1),
  ["Due Date"]: z.string(),
  ["Assignees"]: z.string(),
  ["Comments"]: z.string(),
  ["Status"]: z.enum(statuses),
  ["MoSCoW (drop down)"]: z.enum(priorities).or(z.literal("")),
  ["Area of Work (labels)"]: z.preprocess(
    parseArrayContent,
    z.array(z.enum(labels))
  ),
});

export const commentSchema = z.object({
  text: z.string(),
  date: z.string(),
  by: z.string().email().optional(), // some comment have no author (POC-4975)
});

function parseArrayContent(input: unknown) {
  if (!input || typeof input !== "string") return [];
  return input
    .slice(1, -1)
    .split(",")
    .map((item: string) => item.trim());
}
