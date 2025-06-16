# Slack Webhook MCP Server

A Model Context Protocol (MCP) server for posting messages to Slack via webhooks or bot tokens.

## Features

- **Two modes of operation**: Webhooks or Bot API
- Post messages to Slack channels
- Support for channel overrides  
- Configurable bot username and emoji
- Slack-specific mention support (`<!channel>`, `<!here>`, `<@USERID>`)
- Comprehensive error handling and validation

## Installation

```bash
bun install
```

## Setup

### Option 1: Webhook Mode (Simple)

1. **Create a Slack App and Webhook**:
   - Go to [Slack API Apps](https://api.slack.com/apps)
   - Create a new app or select an existing one
   - Navigate to "Incoming Webhooks" 
   - Enable incoming webhooks
   - Add a new webhook to your workspace
   - Copy the webhook URL (format: `https://hooks.slack.com/services/T.../B.../...`)

2. **Configure MCP Client**:
```json
{
  "mcpServers": {
    "slack-webhook": {
      "command": "bun",
      "args": [
        "run", 
        "src/index.ts",
        "--webhook-url",
        "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
        "--channel",
        "#general"
      ],
      "cwd": "/path/to/slack-webhook-mcp-server"
    }
  }
}
```

### Option 2: Bot Token Mode (Advanced)

1. **Create a Slack App with Bot Token**:
   - Go to [Slack API Apps](https://api.slack.com/apps)
   - Create a new app or select an existing one
   - Go to "OAuth & Permissions"
   - Add bot token scopes: `chat:write`, `chat:write.public`
   - Install app to workspace
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)

2. **Get Channel IDs**:
   - Right-click on channel in Slack → "View channel details" → Copy channel ID
   - Or use Slack API to list channels

3. **Configure MCP Client**:
```json
{
  "mcpServers": {
    "slack-bot": {
      "command": "bun",
      "args": [
        "run", 
        "src/index.ts",
        "--bot-token",
        "xoxb-YOUR-BOT-TOKEN",
        "--channel",
        "CXXXXXXXXXX",
        "--username",
        "MCP Bot"
      ],
      "cwd": "/path/to/slack-webhook-mcp-server"
    }
  }
}
```

## Usage

### Command Line Arguments

**Webhook Mode:**
- `--webhook-url <url>` - Slack webhook URL (required)
- `--channel <channel>` - Default channel name (optional, e.g., "#general")

**Bot Mode:**
- `--bot-token <token>` - Slack bot token (required, starts with `xoxb-`)
- `--channel <channel>` - Default channel ID (required, e.g., "CXXXXXXXXXX")

**Common Options:**
- `--username <username>` - Default bot username (optional)
- `--icon-emoji <emoji>` - Default bot emoji (optional, e.g., ":robot_face:")
- `--help` - Show help message

### Examples

**Webhook Mode:**
```bash
bun run src/index.ts \
  --webhook-url "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX" \
  --channel "#general" \
  --username "Assistant"
```

**Bot Mode:**
```bash
bun run src/index.ts \
  --bot-token "xoxb-YOUR-BOT-TOKEN" \
  --channel "CXXXXXXXXXX" \
  --username "Assistant"
```

### Available Tools

#### `post_slack_message`

Post a message to your configured Slack integration.

**Parameters:**
- `message` (required): The message content to send (max 4000 characters)
- `channel` (optional): Channel to post to (overrides default)
  - Webhook mode: Channel name (e.g., "#random") 
  - Bot mode: Channel ID (e.g., "CXXXXXXXXXX")
- `username` (optional): Override the default username for this message
- `icon_emoji` (optional): Override the default emoji for this message

**Example usage in MCP client:**
```
Please post "Hello from MCP!" to the general channel
```

## Mode Comparison

| Feature | Webhook Mode | Bot Mode |
|---------|-------------|----------|
| **Setup** | Simple | Requires OAuth setup |
| **Channel Reference** | Names (#general) | IDs (CXXXXXXXXXX) |
| **Permissions** | Limited to webhook channel | Configurable scopes |
| **Rate Limits** | Higher | Standard API limits |
| **Features** | Basic messaging | Full API access |
| **Authentication** | URL-based | Token-based |

## Slack-Specific Features

### Mentions
- User mention: `<@U1234567890>`
- Channel notification: `<!channel>`
- Here notification: `<!here>`

### Channel References
- **Webhook mode**: Use `#channel-name` format
- **Bot mode**: Use channel IDs like `CXXXXXXXXXX`

## Development

### Scripts

- `bun run start` - Start the server
- `bun run dev` - Start with file watching  
- `bun run build` - Build for production

### Project Structure

```
slack-webhook-mcp-server/
├── package.json          # Dependencies and scripts
├── src/
│   └── index.ts         # Main server implementation  
├── types/
│   └── slack.ts         # TypeScript types and schemas
└── README.md            # This file
```

## Error Handling

The server includes comprehensive error handling for:
- Invalid webhook URLs and bot tokens
- Network connectivity issues
- Slack API errors (different handling for webhook vs bot)
- Message length validation (4000 char limit)
- Channel ID validation (bot mode)
- Malformed requests

## License

MIT 