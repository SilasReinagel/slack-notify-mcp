import { z } from "zod";

export const SlackWebhookPayloadSchema = z.object({
  text: z.string(),
  channel: z.string().optional(),
  username: z.string().optional(),
  icon_emoji: z.string().optional(),
  mrkdwn: z.boolean().optional(),
});

export type SlackWebhookPayload = z.infer<typeof SlackWebhookPayloadSchema>;

export const SlackBotPayloadSchema = z.object({
  channel: z.string(),
  text: z.string(),
  username: z.string().optional(),
  icon_emoji: z.string().optional(),
  as_user: z.boolean().optional(),
  mrkdwn: z.boolean().optional(),
});

export type SlackBotPayload = z.infer<typeof SlackBotPayloadSchema>;

export const SlackWebhookUrlSchema = z.string()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === "hooks.slack.com" && 
               parsedUrl.pathname.startsWith("/services/");
      } catch {
        return false; 
      }
    },
    "Must be a valid Slack webhook URL"
  );

export const SlackBotTokenSchema = z.string()
  .refine(
    (token) => token.startsWith("xoxb-"),
    "Must be a valid Slack bot token (starts with 'xoxb-')"
  );

export const SlackChannelIdSchema = z.string()
  .refine(
    (channelId) => /^[C|D][A-Z0-9]{8,}$/.test(channelId),
    "Must be a valid Slack channel ID (starts with C or D)"
  );

export const SlackModeSchema = z.enum(["webhook", "bot"]);
export type SlackMode = z.infer<typeof SlackModeSchema>; 