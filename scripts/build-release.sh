#!/bin/bash
#
# Build release binaries for Homebrew distribution
# Usage: ./scripts/build-release.sh [version]
#

set -e

# Get version from argument or package.json
if [ -n "$1" ]; then
  VERSION="$1"
else
  VERSION=$(node -p "require('./package.json').version")
fi

echo "🚀 Building AI Curator v${VERSION} for Homebrew distribution..."

# Create dist directory
mkdir -p dist

# Build for macOS ARM64 (Apple Silicon)
echo "📦 Building for macOS ARM64..."
bun build --compile --target=bun-darwin-arm64 ./bin/cli.js --outfile "dist/curator-${VERSION}-darwin-arm64"

# Build for macOS x64 (Intel)
echo "📦 Building for macOS x64..."
bun build --compile --target=bun-darwin-x64 ./bin/cli.js --outfile "dist/curator-${VERSION}-darwin-x64"

# Build for Linux x64
echo "📦 Building for Linux x64..."
bun build --compile --target=bun-linux-x64 ./bin/cli.js --outfile "dist/curator-${VERSION}-linux-x64"

# Generate SHA256 checksums
echo "🔐 Generating SHA256 checksums..."
cd dist
for file in curator-${VERSION}-*; do
  shasum -a 256 "$file" > "${file}.sha256"
  echo "  ✓ ${file}: $(cat ${file}.sha256 | cut -d' ' -f1)"
done

cd ..

echo ""
echo "✅ Build complete! Binaries in dist/:"
ls -lh dist/curator-${VERSION}-*

echo ""
echo "📋 Next steps:"
echo "  1. Upload binaries to GitHub Release"
echo "  2. Update Homebrew formula with new URLs and SHA256"
echo "  3. Test installation: brew install elgap/tap/ai-curator"
