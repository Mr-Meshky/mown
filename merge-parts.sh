#!/bin/bash

# Mown Parts Merger
# Usage: ./merge-parts.sh [directory]
# If no directory is provided, uses current directory

DIR="${1:-.}"

echo "Mown Parts Merger"
echo "=================="
echo "Scanning directory: $DIR"
echo ""

# Find all zip parts
PARTS=()
while IFS= read -r -d '' file; do
    PARTS+=("$file")
done < <(find "$DIR" -maxdepth 1 -name "part*.zip" -type f -print0 | sort -z)

if [ ${#PARTS[@]} -eq 0 ]; then
    echo "No part zip files found in $DIR"
    echo "Looking for files named like: part01.zip, part02.zip, etc."
    exit 1
fi

echo "Found ${#PARTS[@]} part(s):"
for part in "${PARTS[@]}"; do
    echo "  - $(basename "$part")"
done
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "Extracting parts to temp directory..."
for part in "${PARTS[@]}"; do
    echo "  Extracting $(basename "$part")..."
    unzip -q "$part" -d "$TEMP_DIR"
done

# Find the base filename
BASE_NAME=""
for file in "$TEMP_DIR"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Remove part suffix to get base name
        BASE_NAME=$(echo "$filename" | sed 's/part[0-9]*$//')
        break
    fi
done

if [ -z "$BASE_NAME" ]; then
    echo "Error: Could not determine base filename"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo ""
echo "Base filename: $BASE_NAME"
echo ""

# Find all part files and merge them
echo "Merging parts..."
cd "$TEMP_DIR"

# Get file extension
EXT=""
for file in ${BASE_NAME}part*; do
    if [ -f "$file" ]; then
        EXT="${file##*.}"
        break
    fi
done

# Merge all parts
OUTPUT_FILE="$DIR/${BASE_NAME}merged.$EXT"
cat ${BASE_NAME}part* > "$OUTPUT_FILE"

echo "Merged file saved to: $OUTPUT_FILE"
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""

# Cleanup
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "Done!"
echo ""
echo "You can now delete the part*.zip files if you want."
