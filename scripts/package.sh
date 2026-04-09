#!/bin/bash
#
# AI Curator Packaging Script
# Creates .tar.gz and .zip archives for all platforms
#
# Usage: ./scripts/package.sh [version]
# Example: ./scripts/package.sh 0.5.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from argument or package.json
if [ -n "$1" ]; then
    VERSION="$1"
else
    VERSION=$(node -p "require('./package.json').version")
fi

echo -e "${BLUE}=== AI Curator Packaging Script ===${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo ""

# Check if binaries exist
if [ ! -d "dist" ] || [ -z "$(ls -A dist/curator-* 2>/dev/null)" ]; then
    echo -e "${RED}Error: No binaries found in dist/ directory${NC}"
    echo "Run ./scripts/build-local.sh first"
    exit 1
fi

# Create release directory
RELEASE_DIR="dist/release-${VERSION}"
mkdir -p "$RELEASE_DIR"

echo -e "${BLUE}Packaging binaries for version ${VERSION}...${NC}"
echo ""

# Package function
package_binary() {
    local binary=$1
    local platform=$2
    local arch=$3
    local filename_base="ai-curator-${VERSION}-${platform}-${arch}"
    
    echo -e "${YELLOW}→ Packaging ${platform}-${arch}...${NC}"
    
    # Create directory structure
    local pkg_dir="${RELEASE_DIR}/${filename_base}"
    mkdir -p "$pkg_dir"
    
    # Copy binary
    cp "dist/${binary}" "${pkg_dir}/curator"
    chmod +x "${pkg_dir}/curator"
    
    # Copy additional files
    if [ -f "LICENSE" ]; then
        cp LICENSE "${pkg_dir}/"
    fi
    
    if [ -f "README.md" ]; then
        cp README.md "${pkg_dir}/"
    fi
    
    # Create quick start file
    cat > "${pkg_dir}/QUICKSTART.md" << 'EOF'
# AI Curator Quick Start

## Installation

1. Extract this archive
2. Move the `curator` binary to a directory in your PATH:
   ```bash
   sudo mv curator /usr/local/bin/
   ```
   Or for local install:
   ```bash
   mkdir -p ~/.local/bin
   mv curator ~/.local/bin/
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. Start AI Curator:
   ```bash
   curator
   ```

4. Open your browser to: http://localhost:3333

## CLI Usage

```bash
# Import data
curator import data.jsonl --dataset 1

# Export dataset
curator export --dataset 1 --format mlx --output train.jsonl

# View help
curator --help
```

## Documentation

Full documentation: https://github.com/elgap/ai-curator#readme
EOF
    
    # Create .tar.gz archive
    echo -e "  ${YELLOW}Creating .tar.gz...${NC}"
    tar -czf "${RELEASE_DIR}/${filename_base}.tar.gz" -C "$RELEASE_DIR" "$(basename "$pkg_dir")"
    
    # Create .zip archive
    echo -e "  ${YELLOW}Creating .zip...${NC}"
    (cd "$RELEASE_DIR" && zip -rq "${filename_base}.zip" "$(basename "$pkg_dir")")
    
    # Get sizes
    local tar_size=$(du -h "${RELEASE_DIR}/${filename_base}.tar.gz" | cut -f1)
    local zip_size=$(du -h "${RELEASE_DIR}/${filename_base}.zip" | cut -f1)
    
    echo -e "  ${GREEN}✓ ${filename_base}.tar.gz (${tar_size})${NC}"
    echo -e "  ${GREEN}✓ ${filename_base}.zip (${zip_size})${NC}"
    
    # Cleanup temporary directory
    rm -rf "$pkg_dir"
}

# Package each binary
echo -e "${BLUE}=== Creating Archives ===${NC}"
echo ""

# macOS ARM64
if [ -f "dist/curator-darwin-arm64" ]; then
    package_binary "curator-darwin-arm64" "darwin" "arm64"
    echo ""
fi

# Linux x64
if [ -f "dist/curator-linux-x64" ]; then
    package_binary "curator-linux-x64" "linux" "x64"
    echo ""
fi

# Linux ARM64
if [ -f "dist/curator-linux-arm64" ]; then
    package_binary "curator-linux-arm64" "linux" "arm64"
    echo ""
fi

# Windows x64 (if exists)
if [ -f "dist/curator-windows-x64.exe" ]; then
    package_binary "curator-windows-x64.exe" "windows" "x64"
    echo ""
fi

echo -e "${GREEN}=== Packaging Complete ===${NC}"
echo ""

# List created archives
echo -e "${BLUE}Created archives:${NC}"
ls -lh "${RELEASE_DIR}"/*.tar.gz "${RELEASE_DIR}"/*.zip 2>/dev/null | awk '{print $9, "(" $5 ")"}'
echo ""

echo -e "${GREEN}✓ All packages created in: ${RELEASE_DIR}/${NC}"
