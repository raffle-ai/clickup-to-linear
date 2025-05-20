import { z } from "zod";

const commentSchema = z.object({
  id: z.string(),
  comment_text: z.string(),
  user: z.object({
    email: z.string().email().optional(),
  }),
  date: z.preprocess((val) => Number(val), z.coerce.date()),
});

export const commentsResponseSchema = z.object({
  // comments: z.array(commentSchema),
  comments: z.array(commentSchema).optional().default([]),
});

export function processComment(rawComment: z.infer<typeof commentSchema>) {
  return {
    text: rawComment.comment_text,
    email: rawComment.user.email,
    createdAt: rawComment.date,
  };
}

export type ProcessedComment = ReturnType<typeof processComment>;
