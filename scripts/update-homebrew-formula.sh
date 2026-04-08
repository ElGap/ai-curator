#!/bin/bash
#
# Update Homebrew formula with new version and SHA256 checksums
# Usage: ./scripts/update-homebrew-formula.sh VERSION
#

set -e

VERSION="$1"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 VERSION"
  echo "Example: $0 0.4.0"
  exit 1
fi

echo "🍺 Updating Homebrew formula for v${VERSION}..."

# Download binaries to calculate SHA256
echo "📥 Downloading release binaries..."
mkdir -p tmp
cd tmp

curl -sL -o curator-darwin-arm64 "https://github.com/elgap/ai-curator/releases/download/v${VERSION}/curator-${VERSION}-darwin-arm64"
curl -sL -o curator-darwin-x64 "https://github.com/elgap/ai-curator/releases/download/v${VERSION}/curator-${VERSION}-darwin-x64"
curl -sL -o curator-linux-x64 "https://github.com/elgap/ai-curator/releases/download/v${VERSION}/curator-${VERSION}-linux-x64"

# Calculate SHA256 checksums
echo "🔐 Calculating SHA256 checksums..."
DARWIN_ARM64_SHA=$(sha256sum curator-darwin-arm64 | cut -d' ' -f1)
DARWIN_X64_SHA=$(sha256sum curator-darwin-x64 | cut -d' ' -f1)
LINUX_X64_SHA=$(sha256sum curator-linux-x64 | cut -d' ' -f1)

echo "  macOS ARM64: ${DARWIN_ARM64_SHA}"
echo "  macOS x64:   ${DARWIN_X64_SHA}"
echo "  Linux x64:   ${LINUX_X64_SHA}"

cd ..

# Update formula template
echo "📝 Updating formula..."
sed \
  -e "s/VERSION_PLACEHOLDER/${VERSION}/g" \
  -e "s/DARWIN_ARM64_SHA256_PLACEHOLDER/${DARWIN_ARM64_SHA}/g" \
  -e "s/DARWIN_X64_SHA256_PLACEHOLDER/${DARWIN_X64_SHA}/g" \
  -e "s/LINUX_X64_SHA256_PLACEHOLDER/${LINUX_X64_SHA}/g" \
  homebrew-formula/ai-curator.rb.template > homebrew-formula/ai-curator.rb

echo "✅ Formula updated: homebrew-formula/ai-curator.rb"

# Cleanup
rm -rf tmp

echo ""
echo "📋 Next steps:"
echo "  1. Review the updated formula: cat homebrew-formula/ai-curator.rb"
echo "  2. Copy to homebrew-tap repo: cp homebrew-formula/ai-curator.rb ../homebrew-tap/Formula/"
echo "  3. Commit and push the tap repo update"
echo "  4. Test installation: brew install elgap/tap/ai-curator"
