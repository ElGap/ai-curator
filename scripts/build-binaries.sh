#!/bin/bash
#
# Build release binaries for all platforms
# Usage: ./scripts/build-binaries.sh [version]
#

set -e

VERSION="${1:-$(node -p "require('./package.json').version")}"
echo "🚀 Building AI Curator v${VERSION} binaries..."

# Create dist directory
mkdir -p dist

# Build for macOS ARM64 (Apple Silicon)
echo "📦 Building for macOS ARM64..."
bun build --compile --target=bun-darwin-arm64 \
  ./bin/cli.js \
  --outfile "dist/curator-darwin-arm64"

# Build for macOS x64 (Intel)
echo "📦 Building for macOS x64..."
bun build --compile --target=bun-darwin-x64 \
  ./bin/cli.js \
  --outfile "dist/curator-darwin-x64"

# Build for Linux x64
echo "📦 Building for Linux x64..."
bun build --compile --target=bun-linux-x64 \
  ./bin/cli.js \
  --outfile "dist/curator-linux-x64"

# Build for Linux ARM64
echo "📦 Building for Linux ARM64..."
bun build --compile --target=bun-linux-arm64 \
  ./bin/cli.js \
  --outfile "dist/curator-linux-arm64"

# Build for Windows x64 (only works on Windows or with cross-compilation)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
  echo "📦 Building for Windows x64..."
  bun build --compile --target=bun-windows-x64 \
    ./bin/cli.js \
    --outfile "dist/curator-windows-x64.exe"
else
  echo "⚠️  Skipping Windows build (requires Windows or cross-compilation)"
fi

# Generate checksums
echo "🔐 Generating SHA256 checksums..."
cd dist
for file in curator-*; do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    shasum -a 256 "$file" > "${file}.sha256"
  else
    sha256sum "$file" > "${file}.sha256"
  fi
  echo "  ✓ ${file}"
done

cd ..

echo ""
echo "✅ Build complete!"
echo ""
ls -lh dist/curator-*
echo ""
echo "📋 Next steps:"
echo "  1. Test binaries: ./dist/curator-darwin-arm64 --version"
echo "  2. Upload to GitHub Release"
echo "  3. Update npm package"
