#!/bin/bash

INPUT_DIR="${1:-public}"
OUTPUT_DIR="${2:-public}"
QUALITY=80
METHOD=6

mkdir -p "$OUTPUT_DIR"

echo "Converting PNG files from '$INPUT_DIR' to WebP format..."
echo "Output directory: '$OUTPUT_DIR'"
echo "Quality: $QUALITY, Compression method: $METHOD"
echo "----------------------------------------"

count=0
total_original_size=0
total_optimized_size=0

# Human-readable size formatter (macOS compatible)
human_size() {
    local size=$1
    local unit="B"
    local value=$size

    if [ $size -ge 1073741824 ]; then
        unit="GB"
        value=$(echo "scale=2; $size/1073741824" | bc)
    elif [ $size -ge 1048576 ]; then
        unit="MB"
        value=$(echo "scale=2; $size/1048576" | bc)
    elif [ $size -ge 1024 ]; then
        unit="KB"
        value=$(echo "scale=2; $size/1024" | bc)
    fi
    echo "${value}${unit}"
}

convert_png() {
    local input_file="$1"
    local filename=$(basename "$input_file" .png)
    local filename_lower=$(echo "$filename" | tr '[:upper:]' '[:lower:]')
    local output_file="$OUTPUT_DIR/${filename_lower}.webp"
    
    echo "Converting: $input_file -> $output_file"
    
    magick "$input_file" -quality $QUALITY -define webp:method=$METHOD "$output_file"
    
    if [ $? -eq 0 ]; then
        original_size=$(stat -f%z "$input_file")
        optimized_size=$(stat -f%z "$output_file")
        
        if [ $original_size -gt 0 ]; then
            reduction=$(echo "scale=1; (1 - $optimized_size / $original_size) * 100" | bc -l)
            echo "  Size: $(human_size $original_size) -> $(human_size $optimized_size) (${reduction}% reduction)"
        fi

        total_original_size=$((total_original_size + original_size))
        total_optimized_size=$((total_optimized_size + optimized_size))
        count=$((count + 1))
        
        # Remove original file
        rm "$input_file"
        echo "  Removed original file: $input_file"
    else
        echo "  ERROR: Failed to convert $input_file"
    fi

    echo ""
}

if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Install it with: brew install imagemagick"
    exit 1
fi

png_files=("$INPUT_DIR"/*.png)
if [ ! -f "${png_files[0]}" ]; then
    echo "No PNG files found in '$INPUT_DIR'"
    exit 1
fi

for png_file in "${png_files[@]}"; do
    if [ -f "$png_file" ]; then
        convert_png "$png_file"
    fi
done

echo "========================================="
echo "Conversion complete!"
echo "Files processed: $count"

if [ $total_original_size -gt 0 ]; then
    total_reduction=$(echo "scale=1; (1 - $total_optimized_size / $total_original_size) * 100" | bc -l)
    echo "Total original size: $(human_size $total_original_size)"
    echo "Total optimized size: $(human_size $total_optimized_size)"
    echo "Total size reduction: ${total_reduction}%"
fi
echo "========================================="
