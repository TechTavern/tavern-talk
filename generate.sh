#!/bin/bash
# Generate a WAV file from text using Fish Speech API
# Usage: ./generate.sh "Your text here" [output_filename]

set -e

TEXT="${1:-Hello, this is a test of Fish Speech text to voice generation.}"
OUTPUT="${2:-output/sample.wav}"
API_URL="http://localhost:8080/v1/tts"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_PATH="$SCRIPT_DIR/$OUTPUT"

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT_PATH")"

echo "Generating speech for: \"$TEXT\""
echo "Output: $OUTPUT_PATH"

curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
        \"text\": \"$TEXT\",
        \"format\": \"wav\",
        \"temperature\": 0.8,
        \"top_p\": 0.8,
        \"repetition_penalty\": 1.1
    }" \
    --output "$OUTPUT_PATH"

# Check if output is valid (should be more than a few bytes)
FILE_SIZE=$(stat -c%s "$OUTPUT_PATH" 2>/dev/null || stat -f%z "$OUTPUT_PATH" 2>/dev/null)
if [ "$FILE_SIZE" -lt 1000 ]; then
    echo "Warning: Output file is very small ($FILE_SIZE bytes). The API may have returned an error:"
    cat "$OUTPUT_PATH"
    echo ""
    exit 1
fi

echo "Success! Generated $OUTPUT_PATH ($FILE_SIZE bytes)"
