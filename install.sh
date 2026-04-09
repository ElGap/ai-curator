#!/bin/bash
#
# AI Curator Binary Installer
# Downloads and installs pre-built binaries
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/elgap/ai-curator/main/install.sh | bash
#   curl -fsSL ... | bash -s -- --version 0.5.0
#   curl -fsSL ... | bash -s -- --prefix /usr/local

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

REPO="elgap/ai-curator"
GITHUB_URL="https://github.com/${REPO}"
API_URL="https://api.github.com/repos/${REPO}"

# Default installation directory
PREFIX="${PREFIX:-$HOME/.local}"
INSTALL_DIR="${INSTALL_DIR:-$PREFIX/bin}"
VERSION="${VERSION:-latest}"
FORCE=false
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}           AI Curator Installer                             ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect platform
detect_platform() {
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    local arch=$(uname -m)
    
    # Map architecture names
    case "$arch" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        *)
            print_error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac
    
    # Map OS names
    case "$os" in
        darwin)
            os="darwin"
            ;;
        linux)
            os="linux"
            ;;
        *)
            print_error "Unsupported operating system: $os"
            print_info "AI Curator supports macOS (Apple Silicon) and Linux"
            exit 1
            ;;
    esac
    
    echo "${os}-${arch}"
}

# Get latest version from GitHub
get_latest_version() {
    if [ "$VERSION" != "latest" ]; then
        echo "$VERSION"
        return
    fi
    
    print_info "Checking for latest version..."
    
    # Try to get from latest.json first
    local latest_url="${GITHUB_URL}/releases/latest/download/latest.json"
    local version=$(curl -fsSL "$latest_url" 2>/dev/null | grep -o '"version": "[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$version" ]; then
        echo "$version"
        return
    fi
    
    # Fallback to GitHub API
    version=$(curl -fsSL "${API_URL}/releases/latest" 2>/dev/null | grep -o '"tag_name": "[^"]*"' | head -1 | cut -d'"' -f4 | sed 's/^v//')
    
    if [ -n "$version" ]; then
        echo "$version"
        return
    fi
    
    # Last resort: use hardcoded version
    echo "0.5.0"
}

# Download file with progress
download_file() {
    local url="$1"
    local output="$2"
    
    if command_exists curl; then
        curl -fsSL --progress-bar "$url" -o "$output"
    elif command_exists wget; then
        wget -q --show-progress "$url" -O "$output"
    else
        print_error "Neither curl nor wget found. Please install one of them."
        exit 1
    fi
}

# Verify SHA256 checksum
verify_checksum() {
    local file="$1"
    local expected="$2"
    
    if command_exists sha256sum; then
        local actual=$(sha256sum "$file" | cut -d' ' -f1)
    elif command_exists shasum; then
        local actual=$(shasum -a 256 "$file" | cut -d' ' -f1)
    else
        print_warning "Cannot verify checksum (sha256sum/shasum not found)"
        return 0
    fi
    
    if [ "$actual" != "$expected" ]; then
        print_error "Checksum verification failed!"
        print_error "  Expected: $expected"
        print_error "  Actual:   $actual"
        return 1
    fi
    
    return 0
}

# ============================================================================
# INSTALLATION FUNCTIONS
# ============================================================================

install_binary() {
    local platform="$1"
    local version="$2"
    local install_dir="$3"
    
    local os=$(echo "$platform" | cut -d'-' -f1)
    local arch=$(echo "$platform" | cut -d'-' -f2)
    
    local filename="ai-curator-${version}-${os}-${arch}"
    local archive_name="${filename}.tar.gz"
    local download_url="${GITHUB_URL}/releases/download/v${version}/${archive_name}"
    local temp_dir=$(mktemp -d)
    
    print_info "Platform: ${os} (${arch})"
    print_info "Version: ${version}"
    print_info "Download URL: ${download_url}"
    echo ""
    
    # Download archive
    print_info "Downloading AI Curator ${version}..."
    if ! download_file "$download_url" "${temp_dir}/${archive_name}"; then
        print_error "Failed to download archive"
        print_info "URL: ${download_url}"
        rm -rf "$temp_dir"
        exit 1
    fi
    print_success "Downloaded ${archive_name}"
    
    # Download and verify checksum (optional but recommended)
    print_info "Verifying checksum..."
    local shasums_url="${GITHUB_URL}/releases/download/v${version}/SHASUMS256.txt"
    if curl -fsSL "$shasums_url" -o "${temp_dir}/SHASUMS256.txt" 2>/dev/null; then
        local expected_checksum=$(grep "${archive_name}$" "${temp_dir}/SHASUMS256.txt" | cut -d' ' -f1)
        if [ -n "$expected_checksum" ]; then
            if verify_checksum "${temp_dir}/${archive_name}" "$expected_checksum"; then
                print_success "Checksum verified"
            else
                rm -rf "$temp_dir"
                exit 1
            fi
        else
            print_warning "Checksum not found in SHASUMS256.txt"
        fi
    else
        print_warning "Could not download checksums file"
    fi
    
    # Extract archive
    print_info "Extracting archive..."
    tar -xzf "${temp_dir}/${archive_name}" -C "$temp_dir"
    print_success "Extracted archive"
    
    # Create install directory if needed
    if [ ! -d "$install_dir" ]; then
        print_info "Creating directory: ${install_dir}"
        mkdir -p "$install_dir"
    fi
    
    # Install binary
    local binary_source="${temp_dir}/${filename}/curator"
    local binary_dest="${install_dir}/curator"
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would install: ${binary_source} → ${binary_dest}"
    else
        cp "$binary_source" "$binary_dest"
        chmod +x "$binary_dest"
        print_success "Installed: ${binary_dest}"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    echo ""
    return 0
}

add_to_path() {
    local install_dir="$1"
    
    # Check if already in PATH
    case ":$PATH:" in
        *":$install_dir:"*)
            print_success "Already in PATH"
            return
            ;;
    esac
    
    print_info "Adding to PATH..."
    
    # Detect shell
    local shell_rc=""
    if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
        shell_rc="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        if [ -f "$HOME/.bashrc" ]; then
            shell_rc="$HOME/.bashrc"
        elif [ -f "$HOME/.bash_profile" ]; then
            shell_rc="$HOME/.bash_profile"
        fi
    fi
    
    if [ -n "$shell_rc" ]; then
        if [ "$DRY_RUN" = true ]; then
            print_info "[DRY RUN] Would add to ${shell_rc}: export PATH=\"${install_dir}:\$PATH\""
        else
            echo "" >> "$shell_rc"
            echo "# AI Curator" >> "$shell_rc"
            echo "export PATH=\"${install_dir}:\$PATH\"" >> "$shell_rc"
            print_success "Added to PATH in ${shell_rc}"
        fi
    else
        print_warning "Could not detect shell config file"
        print_info "Add this line manually to your shell config:"
        print_info "  export PATH=\"${install_dir}:\$PATH\""
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --version)
                VERSION="$2"
                shift 2
                ;;
            --prefix)
                PREFIX="$2"
                INSTALL_DIR="${PREFIX}/bin"
                shift 2
                ;;
            --install-dir)
                INSTALL_DIR="$2"
                PREFIX="$(dirname "$INSTALL_DIR")"
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                echo "AI Curator Installer"
                echo ""
                echo "Usage:"
                echo "  curl -fsSL https://.../install.sh | bash"
                echo ""
                echo "Options (pass as arguments):"
                echo "  --version VERSION    Install specific version (default: latest)"
                echo "  --prefix PREFIX      Installation prefix (default: ~/.local)"
                echo "  --install-dir DIR    Binary installation directory (default: ~/.local/bin)"
                echo "  --force              Force reinstall if already exists"
                echo "  --dry-run            Show what would be done without installing"
                echo "  --help, -h           Show this help"
                echo ""
                echo "Examples:"
                echo "  # Install latest version"
                echo "  curl -fsSL .../install.sh | bash"
                echo ""
                echo "  # Install specific version"
                echo "  curl -fsSL .../install.sh | bash -s -- --version 0.5.0"
                echo ""
                echo "  # Install to /usr/local (requires sudo)"
                echo "  curl -fsSL .../install.sh | sudo bash -s -- --prefix /usr/local"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Run with --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Print header
    print_header
    
    # Check prerequisites
    print_info "Checking prerequisites..."
    
    if ! command_exists curl && ! command_exists wget; then
        print_error "curl or wget is required but not installed"
        exit 1
    fi
    
    if ! command_exists tar; then
        print_error "tar is required but not installed"
        exit 1
    fi
    
    print_success "Prerequisites met"
    echo ""
    
    # Detect platform
    print_info "Detecting platform..."
    local platform=$(detect_platform)
    print_success "Detected: ${platform}"
    echo ""
    
    # Get version
    local version=$(get_latest_version)
    print_success "Version: ${version}"
    echo ""
    
    # Check if already installed
    local binary_path="${INSTALL_DIR}/curator"
    if [ -f "$binary_path" ] && [ "$FORCE" != true ] && [ "$DRY_RUN" != true ]; then
        print_warning "AI Curator is already installed at: ${binary_path}"
        print_info "Use --force to reinstall or --version to install a specific version"
        
        # Show current version
        local current_version=$(${binary_path} --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
        if [ -n "$current_version" ]; then
            print_info "Current version: ${current_version}"
            print_info "Latest version:  ${version}"
            
            if [ "$current_version" = "$version" ]; then
                print_success "Already up to date!"
                exit 0
            else
                print_info "To update, run with --force flag"
            fi
        fi
        
        exit 0
    fi
    
    # Install
    print_info "Installing AI Curator..."
    echo ""
    
    if ! install_binary "$platform" "$version" "$INSTALL_DIR"; then
        exit 1
    fi
    
    # Add to PATH
    add_to_path "$INSTALL_DIR"
    
    # Print success message
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}           Installation Complete!                           ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_success "AI Curator ${version} installed successfully"
    echo ""
    print_info "Installation directory: ${INSTALL_DIR}"
    print_info "Binary: ${binary_path}"
    echo ""
    
    # Test installation
    if [ "$DRY_RUN" != true ]; then
        print_info "Testing installation..."
        if "${binary_path}" --version 2>/dev/null; then
            print_success "Installation verified"
        else
            print_warning "Could not verify installation (binary may not work on this system)"
        fi
        echo ""
    fi
    
    # Instructions
    echo -e "${CYAN}Quick Start:${NC}"
    echo ""
    echo "  1. Open a new terminal (or run: source ~/.zshrc or ~/.bashrc)"
    echo ""
    echo "  2. Start AI Curator:"
    echo -e "     ${CYAN}curator${NC}"
    echo ""
    echo "  3. Open your browser to:"
    echo -e "     ${CYAN}http://localhost:3333${NC}"
    echo ""
    echo "  4. CLI commands:"
    echo -e "     ${CYAN}curator --help${NC}          Show all commands"
    echo -e "     ${CYAN}curator import data.json${NC} Import a dataset"
    echo -e "     ${CYAN}curator export --help${NC}   Learn about exporting"
    echo ""
    
    # PATH reminder
    case ":$PATH:" in
        *":$INSTALL_DIR:"*)
            # Already in PATH for this session
            ;;
        *)
            echo "To use curator now, run:"
            echo -e "  ${CYAN}export PATH=\"${INSTALL_DIR}:\$PATH\"${NC}"
            echo ""
            ;;
    esac
    
    echo "Documentation: ${GITHUB_URL}#readme"
    echo "Support: ${GITHUB_URL}/issues"
    echo ""
}

# Run main
main "$@"
