set -e

TARGET_DIR="$HOME/mcp/dev/slack-notify-me"

# Create target directory if it doesn't exist
mkdir -p "$(dirname "$TARGET_DIR")"

# Remove existing target if it exists
if [ -d "$TARGET_DIR" ]; then
  rm -rf "$TARGET_DIR"
fi

# Copy current repo to target directory
cp -R . "$TARGET_DIR"

echo "Copied repo to $TARGET_DIR"
