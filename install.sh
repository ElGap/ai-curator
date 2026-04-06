#!/bin/bash

# AI Curator Installer
# One-command installation for non-technical users
#
# Usage:
#   One-line install:  curl -fsSL https://raw.githubusercontent.com/elgap/ai-curator/main/install.sh | bash
#   With auto-yes:    curl -fsSL ... | bash -s -- --yes
#   Local install:    ./install.sh

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

REPO_URL="https://github.com/elgap/ai-curator"
AUTO_YES=false
INSTALL_NODE=false
INSTALL_DIR=""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# Detect if running in developer mode (from git repo) or user mode (piped)
detect_mode() {
    if [ -d ".git" ] && [ -f "package.json" ] && [ -f "README.md" ]; then
        echo "developer"
    else
        echo "user"
    fi
}

# Read from TTY when script is piped (for user prompts)
read_tty() {
    if [ -t 0 ]; then
        read "$@"
    else
        read "$@" < /dev/tty
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# OS DETECTION
# ============================================================================

detect_os() {
    case "$(uname -s)" in
        Darwin)
            echo "macos"
            ;;
        Linux)
            echo "linux"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_os() {
    OS=$(detect_os)
    
    if [ "$OS" = "unknown" ]; then
        echo "Error: AI Curator supports macOS and Linux only"
        echo "Your OS: $(uname -s)"
        exit 1
    fi
    
    echo "Operating System: $OS"
}

check_arch() {
    local arch=$(uname -m)
    echo "Architecture: $arch"
    
    if [[ "$arch" == "arm64" ]] || [[ "$arch" == "aarch64" ]]; then
        echo "Apple Silicon / ARM64 detected"
    elif [[ "$arch" == "x86_64" ]]; then
        echo "Intel/AMD x86_64 detected"
    else
        echo "Warning: Architecture $arch may not be fully supported"
    fi
}

check_nodejs() {
    echo ""
    echo "Checking Node.js..."
    
    if ! command_exists node; then
        echo "Node.js is not installed."
        
        if [ "$MODE" = "user" ]; then
            echo "It will be installed automatically."
            INSTALL_NODE=true
        else
            echo "Error: Node.js is required"
            echo "Please install Node.js 18+ from https://nodejs.org/"
            exit 1
        fi
    else
        local node_version=$(node --version | grep -o 'v[0-9]*' | head -1 | tr -d 'v')
        
        if [ -z "$node_version" ]; then
            node_version=$(node --version 2>&1 | grep -o '[0-9]*' | head -1)
        fi
        
        if [ "$node_version" -lt 18 ]; then
            if [ "$MODE" = "user" ]; then
                echo "Node.js version $node_version found, but 18+ is required"
                echo "It will be upgraded automatically."
                INSTALL_NODE=true
            else
                echo "Error: Node.js 18 or higher is required (found $(node --version))"
                exit 1
            fi
        else
            echo "Node.js $(node --version) found ✓"
        fi
    fi
    
    # Check npm
    if ! command_exists npm; then
        if [ "$INSTALL_NODE" = false ]; then
            echo "Error: npm is not installed (should come with Node.js)"
            exit 1
        fi
    else
        echo "npm $(npm --version) found ✓"
    fi
}

check_build_tools() {
    echo ""
    echo "Checking build tools..."
    
    if [ "$OS" = "macos" ]; then
        # Check for Xcode Command Line Tools
        if ! command_exists gcc; then
            echo "Warning: Xcode Command Line Tools not found"
            echo "Installing now (this may take a few minutes)..."
            xcode-select --install 2>/dev/null || true
            
            if [ "$AUTO_YES" = false ]; then
                echo ""
                echo "Please click 'Install' in the dialog that appeared."
                read_tty -p "Press Enter when installation is complete..."
            else
                echo "Please complete the installation manually and run this script again."
                exit 1
            fi
        else
            echo "Xcode Command Line Tools found ✓"
        fi
        
        # Check for Python (needed for node-gyp)
        if ! command_exists python3; then
            echo "Python 3 not found. Installing via Xcode CLT..."
            # Python should be installed with Xcode CLT
            if ! command_exists python3; then
                echo "Warning: Python 3 installation may have failed"
                echo "You may need to install it manually."
            fi
        else
            echo "Python $(python3 --version 2>&1 | cut -d' ' -f2) found ✓"
        fi
        
    elif [ "$OS" = "linux" ]; then
        # Check for build-essential
        if ! command_exists gcc; then
            echo "Build tools not found. Please install:"
            echo "  Ubuntu/Debian: sudo apt-get install build-essential python3"
            echo "  Fedora/RHEL:   sudo dnf install gcc-c++ python3"
            echo "  Arch:          sudo pacman -S base-devel python"
            
            if [ "$AUTO_YES" = false ]; then
                read_tty -p "Have you installed the build tools? (y/N) " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            else
                exit 1
            fi
        else
            echo "Build tools found ✓"
        fi
    fi
}

check_git() {
    echo ""
    echo "Checking Git..."
    
    if ! command_exists git; then
        if [ "$OS" = "macos" ]; then
            echo "Git not found. Installing Xcode Command Line Tools..."
            xcode-select --install 2>/dev/null || true
            echo "Please complete the installation and run this script again."
            exit 1
        elif [ "$OS" = "linux" ]; then
            echo "Git not found. Please install it:"
            echo "  Ubuntu/Debian: sudo apt-get install git"
            echo "  Fedora/RHEL:   sudo dnf install git"
            exit 1
        fi
    fi
    
    echo "Git $(git --version | cut -d' ' -f3) found ✓"
}

# ============================================================================
# INSTALLATION STEPS
# ============================================================================

install_nodejs_macos() {
    echo ""
    echo "Installing Node.js for macOS..."
    echo "Downloading Node.js LTS..."
    
    # Get latest LTS version
    local node_version="20.11.1"
    local pkg_file="node-v${node_version}.pkg"
    
    # Detect architecture
    local arch=$(uname -m)
    if [[ "$arch" == "arm64" ]]; then
        local download_url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-arm64.pkg"
    else
        local download_url="https://nodejs.org/dist/v${node_version}/node-v${node_version}.pkg"
    fi
    
    curl -fsSL "$download_url" -o "/tmp/$pkg_file" || {
        echo "Error: Failed to download Node.js"
        echo "Please install manually from https://nodejs.org/"
        exit 1
    }
    
    echo "Installing Node.js (you may need to enter your password)..."
    sudo installer -pkg "/tmp/$pkg_file" -target / || {
        echo "Error: Failed to install Node.js"
        exit 1
    }
    
    rm "/tmp/$pkg_file"
    
    # Update PATH for current session
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
    
    echo "Node.js $(node --version) installed ✓"
}

install_nodejs_linux() {
    echo ""
    echo "Installing Node.js for Linux..."
    
    # Detect package manager
    if command_exists apt-get; then
        echo "Using apt (Debian/Ubuntu)..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists dnf; then
        echo "Using dnf (Fedora/RHEL)..."
        sudo dnf install -y nodejs
    elif command_exists pacman; then
        echo "Using pacman (Arch)..."
        sudo pacman -S --noconfirm nodejs npm
    elif command_exists zypper; then
        echo "Using zypper (openSUSE)..."
        sudo zypper install -y nodejs npm
    else
        echo "Error: Could not detect package manager"
        echo "Please install Node.js 18+ manually from https://nodejs.org/"
        exit 1
    fi
    
    echo "Node.js $(node --version) installed ✓"
}

install_nodejs() {
    if [ "$INSTALL_NODE" = true ]; then
        if [ "$OS" = "macos" ]; then
            install_nodejs_macos
        else
            install_nodejs_linux
        fi
    fi
}

setup_installation_directory() {
    echo ""
    echo "Setting up installation directory..."
    
    if [ "$MODE" = "user" ]; then
        # Install in current directory
        INSTALL_DIR="$(pwd)"
        
        # Check if directory is not empty
        if [ "$(ls -A 2>/dev/null)" ]; then
            echo "Installing in: $INSTALL_DIR"
            echo "Note: Directory is not empty, files will be added"
            echo ""
        fi
        
        # Clone repository
        echo "Downloading AI Curator..."
        echo "Installing to: $INSTALL_DIR/ai-curator"
        
        if [ -d "ai-curator" ]; then
            echo "Directory 'ai-curator' already exists"
            echo "Updating existing installation..."
            cd ai-curator
            git pull origin main || {
                echo "Warning: Could not update, continuing with existing version"
            }
        else
            git clone --depth 1 "$REPO_URL.git" ai-curator || {
                echo "Error: Failed to download AI Curator"
                exit 1
            }
            cd ai-curator
        fi
        
        INSTALL_DIR="$(pwd)"
        echo "Downloaded successfully"
    else
        # Developer mode
        INSTALL_DIR="$(pwd)"
        echo "Developer mode. Installing in: $INSTALL_DIR"
    fi
}

install_dependencies() {
    echo ""
    echo "Installing Node.js dependencies..."
    echo "This may take a few minutes (compiling native modules)..."
    
    # Install with verbose output for progress
    npm ci 2>&1 | tee /tmp/npm-install.log | grep -E "(added|packages?|built|gyp|error)" || true
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo ""
        echo "Error: npm install failed"
        echo "Check /tmp/npm-install.log for details"
        
        # Check for common issues
        if grep -q "gyp" /tmp/npm-install.log; then
            echo ""
            echo "This looks like a build tools issue. Please ensure you have:"
            echo "  - macOS: Xcode Command Line Tools (xcode-select --install)"
            echo "  - Linux: build-essential (apt-get install build-essential)"
        fi
        
        exit 1
    fi
    
    echo "Dependencies installed ✓"
}

build_application() {
    echo ""
    echo "Building AI Curator..."
    
    npm run build || {
        echo "Error: Build failed"
        exit 1
    }
    
    npm run bundle:cli || {
        echo "Error: CLI bundling failed"
        exit 1
    }
    
    echo "Build complete ✓"
}

create_launch_script() {
    echo ""
    echo "Creating launch script..."
    
    cat > launch.sh << 'EOF'
#!/bin/bash
# AI Curator Launcher

set -e

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$INSTALL_DIR"

echo "🎨 Starting AI Curator..."
echo "   Open http://localhost:3333 in your browser"
echo "   Press Ctrl+C to stop"
echo ""

node dist/curator.mjs "$@"
EOF
    
    chmod +x launch.sh
    echo "Created: launch.sh"
}

create_desktop_shortcut() {
    if [ "$MODE" = "user" ] && [ "$OS" = "macos" ]; then
        echo ""
        echo "Creating Desktop shortcut..."
        
        local desktop_link="${HOME}/Desktop/AI-Curator.command"
        cat > "$desktop_link" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
./launch.sh
EOF
        chmod +x "$desktop_link"
        echo "Created Desktop shortcut: ~/Desktop/AI-Curator.command"
    fi
}

add_to_path() {
    if [ "$MODE" = "user" ]; then
        echo ""
        echo "Adding to PATH..."
        
        local shell_rc=""
        if [ -f "$HOME/.zshrc" ]; then
            shell_rc="$HOME/.zshrc"
        elif [ -f "$HOME/.bashrc" ]; then
            shell_rc="$HOME/.bashrc"
        fi
        
        if [ -n "$shell_rc" ]; then
            # Check if already in PATH
            if ! grep -q "ai-curator/bin" "$shell_rc" 2>/dev/null; then
                echo "export PATH=\"$INSTALL_DIR/bin:\$PATH\"" >> "$shell_rc"
                echo "Added to PATH in $shell_rc"
                echo "Run 'source $shell_rc' to update your current terminal"
            else
                echo "Already in PATH ✓"
            fi
        else
            echo "Could not detect shell config file"
            echo "Add this to your shell config:"
            echo "  export PATH=\"$INSTALL_DIR/bin:\$PATH\""
        fi
    fi
}

# ============================================================================
# MAIN INSTALLATION FLOW
# ============================================================================

main() {
    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --yes|-y)
                AUTO_YES=true
                shift
                ;;
            --help|-h)
                echo "AI Curator Installer"
                echo ""
                echo "Usage:"
                echo "  curl -fsSL .../install.sh | bash"
                echo "  curl -fsSL .../install.sh | bash -s -- --yes"
                echo "  ./install.sh [--yes]"
                echo ""
                echo "Options:"
                echo "  --yes, -y    Auto-accept all prompts"
                echo "  --help, -h   Show this help"
                exit 0
                ;;
        esac
    done
    
    # Detect mode
    MODE=$(detect_mode)
    OS=$(detect_os)
    
    # Header
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║          AI Curator Installer                      ║"
    echo "║          Version 0.3.0-beta                        ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "Mode: $MODE"
    echo ""
    
    # Welcome / Continue prompt (user mode only)
    if [ "$MODE" = "user" ]; then
        echo "Welcome! This installer will set up AI Curator on your computer."
        echo ""
        echo "AI Curator - Privacy-first dataset curation for LLM fine-tuning"
        echo ""
        echo "What will be installed:"
        echo "   - Node.js (if not present or outdated)"
        echo "   - AI Curator application"
        echo "   - Build tools (for database compilation)"
        echo ""
        
        if [ "$AUTO_YES" = false ]; then
            read_tty -p "Continue with installation? (Y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]] && [ -n "$REPLY" ]; then
                echo "Installation cancelled."
                exit 0
            fi
        fi
    fi
    
    # System checks
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Checking your system..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    check_os
    check_arch
    check_nodejs
    check_build_tools
    check_git
    
    # Installation
    install_nodejs
    setup_installation_directory
    install_dependencies
    build_application
    
    # Import EdukaAI Starter Pack (75 premium samples)
    echo ""
    echo "📦 Importing EdukaAI Starter Pack..."
    if [ -f "$INSTALL_DIR/datasets/starter-pack/metadata.json" ]; then
        cd "$INSTALL_DIR"
        # Read metadata
        DATASET_NAME=$(node -e "console.log(require('./datasets/starter-pack/metadata.json').dataset_name || 'Starter Pack')")
        TOTAL_SAMPLES=$(node -e "console.log(require('./datasets/starter-pack/metadata.json').total_samples || 75)")
        AUTHOR=$(node -e "console.log(require('./datasets/starter-pack/metadata.json').author || 'EdukaAI')")
        LICENSE=$(node -e "console.log(require('./datasets/starter-pack/metadata.json').license || 'CC-BY-4.0')")
        
        # Initialize database first (creates the datasets)
        node dist/curator.mjs reset --force >/dev/null 2>&1 || true
        # Import the starter pack
        if node dist/curator.mjs import "datasets/starter-pack/samples.json" --dataset 2 --status approved --workers 4 2>&1 | grep -q "Import complete"; then
            echo "   ✅ $TOTAL_SAMPLES premium samples loaded and ready!"
            echo "      Dataset: $DATASET_NAME"
            echo "      Author: $AUTHOR"
            echo "      License: $LICENSE"
        else
            echo "   ⚠️  Starter pack import may have failed, but you can import manually later:"
            echo "      curator import datasets/starter-pack/samples.json --dataset 2 --status approved"
        fi
    else
        echo "   ⚠️  Starter pack not found, but you can still use AI Curator with your own data"
    fi
    
    create_launch_script
    create_desktop_shortcut
    add_to_path
    
    # Completion
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║          Installation Complete!                    ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    
    if [ "$MODE" = "user" ]; then
        echo "Installation location: $INSTALL_DIR"
        echo ""
        echo "To start AI Curator:"
        echo "   cd $INSTALL_DIR"
        echo "   ./launch.sh"
        echo ""
        
        if [ "$OS" = "macos" ]; then
            echo "Or double-click 'AI-Curator.command' on your Desktop"
            echo ""
        fi
        
        echo "Once running, open: http://localhost:3333"
        echo ""
        echo "🚀 Quick Start Options:"
        echo ""
        echo "   Option 1: Train immediately (5 minutes!)"
        echo "      The EdukaAI Starter Pack is already imported with 75 samples:"
        echo "      curator export --dataset 2 --format mlx --output train.jsonl"
        echo ""
        echo "   Option 2: Import your own data"
        echo "      curator import your-data.json --dataset 1"
        echo ""
        echo "   Option 3: Enable live capture"
        echo "      Stream data from your IDE, scripts, or any tool:"
        echo "      curator → Settings → Live Capture → Enable"
        echo ""
        echo "Documentation: $INSTALL_DIR/README.md"
        echo "Website: https://edukaai.elgap.ai"
        echo "Support: https://github.com/elgap/ai-curator/issues"
        echo ""
        
        # Offer to launch
        if [ "$AUTO_YES" = false ]; then
            read_tty -p "Launch AI Curator now? (Y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
                echo ""
                echo "Launching AI Curator..."
                sleep 2
                ./launch.sh
            fi
        else
            echo ""
            echo "To start AI Curator, run:"
            echo "  cd $INSTALL_DIR && ./launch.sh"
        fi
    else
        # Developer mode
        echo "Installation complete in: $INSTALL_DIR"
        echo ""
        echo "To start AI Curator:"
        echo "   npm run dev           # Development mode"
        echo "   ./launch.sh           # Production mode"
        echo ""
        echo "Or run CLI commands:"
        echo "   node dist/curator.mjs --help"
    fi
}

# Run main function
main "$@"
