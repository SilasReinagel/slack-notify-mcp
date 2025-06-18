#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { 
  SlackWebhookPayload, 
  SlackBotPayload,
  SlackWebhookUrlSchema, 
  SlackBotTokenSchema,
  SlackChannelIdSchema,
  SlackMode
} from "../types/slack.js";

interface ServerConfig {
  mode: SlackMode;
  // Webhook mode
  webhookUrl?: string;
  // Bot mode
  botToken?: string;
  // Common options
  defaultChannel?: string;
  defaultUsername?: string;
  defaultIconEmoji?: string;
}

class SlackWebhookMCPServer {
  private server: Server;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: "slack-webhook-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "post_slack_message",
          description: `Post a message to the configured Slack channel only (${this.config.mode} mode)`,
          inputSchema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The message content to send (max 4000 characters). Supports Slack mrkdwn formatting: *bold*, `code`, ~strikethrough~, ```code blocks```, and >quotes. Note: Use single asterisks (*) for bold, not double (**) like standard Markdown.",
              }
            },
            required: ["message"],
            additionalProperties: false
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "post_slack_message") {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const { message } = request.params.arguments as {
        message: string;
      };

      if (!message || typeof message !== "string") {
        throw new Error("Message is required and must be a string");
      }

      if (message.length > 4000) {
        throw new Error("Message is too long (max 4000 characters)");
      }

      try {
        await this.postToSlack({ message });

        return {
          content: [
            {
              type: "text",
              text: `Message posted to Slack successfully via ${this.config.mode}!`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text", 
              text: `Failed to post message to Slack: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async postToSlack({ message }: { message: string }) {
    if (this.config.mode === 'webhook') {
      return this.postViaWebhook({ message });
    } else {
      return this.postViaBot({ message });
    }
  }

  private async postViaWebhook({ message }: { message: string }) {
    if (!this.config.webhookUrl) {
      throw new Error("Webhook URL not configured");
    }

    const payload: SlackWebhookPayload = {
      text: message,
      mrkdwn: true,
      ...(this.config.defaultChannel ? { channel: this.config.defaultChannel } : {}),
      ...(this.config.defaultUsername ? { username: this.config.defaultUsername } : {}),
      ...(this.config.defaultIconEmoji ? { icon_emoji: this.config.defaultIconEmoji } : {}),
    };

    try {
      const response = await axios.post(this.config.webhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.status !== 200) {
        throw new Error(`Slack API returned status ${response.status}: ${response.statusText}`);
      }

      if (response.data !== "ok") {
        throw new Error(`Slack API returned error: ${response.data}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `Slack webhook request failed: ${error.response.status} ${error.response.statusText}`
          );
        } else if (error.request) {
          throw new Error("Slack webhook request failed: No response received");
        } else {
          throw new Error(`Slack webhook request failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  private async postViaBot({ message }: { message: string }) {
    if (!this.config.botToken) {
      throw new Error("Bot token not configured");
    }

    const targetChannel = this.config.defaultChannel;
    if (!targetChannel) {
      throw new Error("Channel is required for bot mode");
    }

    const payload: SlackBotPayload = {
      channel: targetChannel,
      text: message,
      ...(this.config.defaultUsername ? { username: this.config.defaultUsername } : {}),
      ...(this.config.defaultIconEmoji ? { icon_emoji: this.config.defaultIconEmoji } : {}),
    };

    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.botToken}`,
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200) {
        throw new Error(`Slack API returned status ${response.status}: ${response.statusText}`);
      }

      const data = response.data;
      if (!data.ok) {
        throw new Error(`Slack API returned error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorData = error.response.data;
          const errorMsg = errorData?.error || error.response.statusText;
          throw new Error(`Slack bot request failed: ${error.response.status} ${errorMsg}`);
        } else if (error.request) {
          throw new Error("Slack bot request failed: No response received");
        } else {
          throw new Error(`Slack bot request failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Slack MCP server running on stdio (${this.config.mode} mode)`);
  }
}

function parseArgs(): ServerConfig {
  const args = process.argv.slice(2);
  let mode: SlackMode = 'webhook';
  let webhookUrl = "";
  let botToken = "";
  let defaultChannel: string | undefined;
  let defaultUsername: string | undefined;
  let defaultIconEmoji: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--webhook-url":
        webhookUrl = args[++i];
        mode = 'webhook';
        break;
      case "--bot-token":
        botToken = args[++i];
        mode = 'bot';
        break;
      case "--channel":
        defaultChannel = args[++i];
        break;
      case "--username":
        defaultUsername = args[++i];
        break;
      case "--icon-emoji":
        defaultIconEmoji = args[++i];
        break;
      case "--help":
        console.log(`
Usage: slack-webhook-mcp-server [options]

Webhook Mode:
  --webhook-url <url>    Slack webhook URL (required for webhook mode)

Bot Mode:
  --bot-token <token>    Slack bot token (required for bot mode, starts with xoxb-)

Common Options:
  --channel <channel>    Channel to post to (required)
  --username <username>  Default bot username (optional)
  --icon-emoji <emoji>   Default bot emoji (optional, e.g. :robot_face:)
  --help                 Show this help message

Examples:
  # Webhook mode
  slack-webhook-mcp-server --webhook-url "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" --channel "#general"

  # Bot mode
  slack-webhook-mcp-server --bot-token "xoxb-..." --channel "CXXXXXXXXXX"
        `);
        process.exit(0);
        break;
    }
  }

  // Validate configuration
  if (mode === 'webhook') {
    if (!webhookUrl) {
      console.error("Error: --webhook-url is required for webhook mode");
      console.error("Use --help for usage information");
      process.exit(1);
    }

    try {
      SlackWebhookUrlSchema.parse(webhookUrl);
    } catch (error) {
      console.error("Error: Invalid Slack webhook URL provided");
      if (error instanceof Error) {
        console.error(error.message);  
      }
      process.exit(1);
    }
    if (!defaultChannel) {
      console.error("Error: --channel is required for webhook mode");
      process.exit(1);
    }
  } else if (mode === 'bot') {
    if (!botToken) {
      console.error("Error: --bot-token is required for bot mode");
      console.error("Use --help for usage information");
      process.exit(1);
    }

    try {
      SlackBotTokenSchema.parse(botToken);
    } catch (error) {
      console.error("Error: Invalid Slack bot token provided");
      if (error instanceof Error) {
        console.error(error.message);  
      }
      process.exit(1);
    }

    if (!defaultChannel) {
      console.error("Error: --channel is required for bot mode");
      process.exit(1);
    }
    // For bot mode, validate channel ID
    try {
      SlackChannelIdSchema.parse(defaultChannel);
    } catch (error) {
      console.error("Error: Invalid Slack channel ID provided for bot mode");
      console.error("Channel ID should start with 'C' or 'D' (e.g., CXXXXXXXXXX)");
      process.exit(1);
    }
  }

  return {
    mode,
    webhookUrl: webhookUrl || undefined,
    botToken: botToken || undefined,
    defaultChannel,
    defaultUsername,
    defaultIconEmoji,
  };
}

const config = parseArgs();
const server = new SlackWebhookMCPServer(config);
server.run().catch(console.error);

// Export types for consumers of this package
export * from "../types/slack.js";
export { SlackWebhookMCPServer }; 