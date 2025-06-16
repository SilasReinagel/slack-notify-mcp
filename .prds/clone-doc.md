# Slack Webhook MCP Server Implementation Guide

## Overview
Build a Slack webhook MCP server following the same pattern as the Discord implementation.

## Project Structure
```
slack-webhook-mcp-server/
├── package.json
├── src/index.ts
├── types/slack.ts
└── README.md
```

## Dependencies (package.json)
- @modelcontextprotocol/sdk: ^1.12.1
- axios: ^1.7.9
- zod: ^3.25.64

## Core Components

### 1. Slack Webhook Payload Types (types/slack.ts)
```typescript
import { z } from "zod";

export const SlackWebhookPayloadSchema = z.object({
  text: z.string(),
  channel: z.string().optional(),
  username: z.string().optional(),
  icon_emoji: z.string().optional(),
});

export type SlackWebhookPayload = z.infer<typeof SlackWebhookPayloadSchema>;
```

### 2. Main Implementation (src/index.ts)

**Key Differences from Discord:**
- Slack webhook URL format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`
- Payload structure: `{ text: "message" }` instead of `{ content: "message" }`  
- Mentions: `<@USERID>` for users, `<!channel>` for channel notifications
- Channels: Optional `channel` parameter (e.g., "#general")

**CLI Configuration:**
- `--webhook-url`: Slack webhook URL
- `--channel`: Default channel (optional)
- `--username`: Bot username (optional)
- `--icon-emoji`: Bot emoji (optional)

**Tool Schema:**
```typescript
{
  name: "post_slack_message",
  description: "Post a message to a Slack webhook",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The message content to send",
      },
      channel: {
        type: "string", 
        description: "Channel to post to (optional)",
      },
    },
    required: ["message"],
  },
}
```

### 3. Message Building Logic
- Handle Slack-specific mentions: `<!channel>`, `<!here>`, `<@USERID>`
- Support channel parameter override
- Include username and icon emoji from CLI config

### 4. Error Handling
- Validate Slack webhook URL format
- Handle Slack API errors (different status codes than Discord)
- Include meaningful error messages

## Slack-Specific Implementation Notes

**Webhook URL Validation:**
```typescript
const SlackWebhookUrlSchema = z.string()
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
```

**Mention Formats:**
- User mention: `<@U1234567890>`
- Channel notification: `<!channel>`
- Here notification: `<!here>`

**Payload Structure:**
```typescript
const payload: SlackWebhookPayload = {
  text: messageContent,
  ...(channel && { channel }),
  ...(username && { username }),
  ...(iconEmoji && { icon_emoji: iconEmoji }),
};
```

## MCP Client Configuration
```json
{
  "mcpServers": {
    "slack-webhook": {
      "command": "bun",
      "args": [
        "run", 
        "src/index.ts",
        "--webhook-url",
        "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
      ],
      "cwd": "/path/to/slack-webhook-mcp-server"
    }
  }
}
```

## Testing
- Create Slack webhook in Slack app settings
- Test with basic message
- Test channel overrides
- Test mention functionality

## Build & Run Commands
- `bun install`
- `bun run start`
- `bun run dev` (watch mode)
- `bun run build` 