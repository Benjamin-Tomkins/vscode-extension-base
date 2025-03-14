#!/bin/bash

set -e
set -u

# Colors and formatting
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
BOLD="\033[1m"
RESET="\033[0m"
SPACE=" "
DOUBLE_SPACE="  "

# Get script directory
SCRIPT_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
EXTENSION_DIR="${SCRIPT_DIR}"
EXTENSION_NAME=$(node -e "console.log(require('${EXTENSION_DIR}/package.json').name)" 2>/dev/null || echo "vscode-extension")

# Detect which VSCode CLI is available
VSCODE_CLI=""
if command -v code-insiders >/dev/null 2>&1; then
    VSCODE_CLI="code-insiders"
elif command -v code >/dev/null 2>&1; then
    VSCODE_CLI="code"
fi

# Log functions
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${RESET}"
}

log_step() {
    log "$BLUE" "➜${DOUBLE_SPACE}$1"
}

log_success() {
    log "$GREEN" "✓${DOUBLE_SPACE}$1"
}

log_warn() {
    log "$YELLOW" "⚠${DOUBLE_SPACE}$1"
}

log_error() {
    log "$RED" "✗${DOUBLE_SPACE}$1"
}

log_info() {
    log "$CYAN" "ℹ${DOUBLE_SPACE}$1"
}

# Check for required tools
check_tools() {
    local missing=false
    
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is required but not installed"
        missing=true
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm is required but not installed"
        missing=true
    fi
    
    if [ -z "$VSCODE_CLI" ]; then
        log_warn "Neither VSCode nor VSCode Insiders CLI found in PATH, some features may not work"
    else
        log_info "Using $VSCODE_CLI for VSCode operations"
    fi
    
    if $missing; then
        return 1
    fi
    
    return 0
}

# Initialize a new VSCode extension
create_extension() {
    log_step "Creating new VSCode extension..."
    
    # Prompt for extension details
    read -p "$(echo -e "${CYAN}Extension name:${RESET} ")" ext_name
    read -p "$(echo -e "${CYAN}Display name:${RESET} ")" display_name
    read -p "$(echo -e "${CYAN}Description:${RESET} ")" description
    
    if [ -z "$ext_name" ]; then
        log_error "Extension name is required"
        return 1
    fi
    
    # Create extension using Yeoman generator
    if ! command -v yo >/dev/null 2>&1 || ! command -v generator-code >/dev/null 2>&1; then
        log_step "Installing required generator tools..."
        npm install -g yo generator-code
    fi
    
    log_step "Scaffolding extension..."
    mkdir -p "$ext_name"
    cd "$ext_name"
    
    yo code --extensionType=typescript \
            --extensionName="$ext_name" \
            --displayName="${display_name:-$ext_name}" \
            --description="${description:-A VSCode extension}" \
            --gitInit
    
    if [ $? -eq 0 ]; then
        log_success "Extension created successfully at $(pwd)"
        EXTENSION_DIR=$(pwd)
        EXTENSION_NAME="$ext_name"
        return 0
    else
        log_error "Failed to create extension"
        return 1
    fi
}

# Build the extension
build_extension() {
    log_step "Building extension..."
    cd "$EXTENSION_DIR"
    
    npm install
    npm run compile
    
    if [ $? -eq 0 ]; then
        log_success "Extension built successfully"
        return 0
    else
        log_error "Build failed"
        return 1
    fi
}

# Package the extension
package_extension() {
    log_step "Packaging extension..."
    cd "$EXTENSION_DIR"
    
    if ! command -v vsce >/dev/null 2>&1; then
        log_step "Installing vsce packaging tool..."
        npm install -g @vscode/vsce
    fi
    
    vsce package
    
    if [ $? -eq 0 ]; then
        vsix_file=$(find . -maxdepth 1 -name "*.vsix" | sort -r | head -n1)
        log_success "Extension packaged: $vsix_file"
        return 0
    else
        log_error "Packaging failed"
        return 1
    fi
}

# Install the extension to VSCode
install_extension() {
    log_step "Installing extension..."
    cd "$EXTENSION_DIR"
    
    vsix_file=$(find . -maxdepth 1 -name "*.vsix" | sort -r | head -n1)
    
    if [ -z "$vsix_file" ]; then
        log_warn "No .vsix package found, building and packaging first..."
        build_extension && package_extension
        vsix_file=$(find . -maxdepth 1 -name "*.vsix" | sort -r | head -n1)
    fi
    
    if [ -z "$vsix_file" ]; then
        log_error "No .vsix package found after build attempt"
        return 1
    fi
    
    if [ -n "$VSCODE_CLI" ]; then
        $VSCODE_CLI --install-extension "$vsix_file"
        
        if [ $? -eq 0 ]; then
            log_success "Extension installed successfully"
            return 0
        else
            log_error "Installation failed"
            return 1
        fi
    else
        log_error "No VSCode CLI available for installation"
        return 1
    fi
}

# Uninstall the extension from VSCode
uninstall_extension() {
    log_step "Uninstalling extension..."
    
    if [ -n "$VSCODE_CLI" ]; then
        $VSCODE_CLI --uninstall-extension "$EXTENSION_NAME"
        
        if [ $? -eq 0 ]; then
            log_success "Extension uninstalled successfully"
            return 0
        else
            log_error "Uninstallation failed"
            return 1
        fi
    else
        log_error "No VSCode CLI available for uninstallation"
        return 1
    fi
}

# Run the extension in debug mode
debug_extension() {
    log_step "Launching extension in debug mode..."
    cd "$EXTENSION_DIR"
    
    if [ -n "$VSCODE_CLI" ]; then
        # Open VSCode with the extension directory
        $VSCODE_CLI "$EXTENSION_DIR"
        log_success "$VSCODE_CLI opened with extension directory"
        log_info "Press F5 or use the Run and Debug panel to start debugging"
    else
        log_error "No VSCode CLI available, please open VSCode manually and run the extension in debug mode"
        return 1
    fi
    
    return 0
}

# Watch for changes and rebuild automatically
watch_extension() {
    log_step "Starting watch mode..."
    cd "$EXTENSION_DIR"
    
    npm run watch &
    watch_pid=$!
    
    log_success "Watch mode started (PID: $watch_pid)"
    log_info "Press Ctrl+C to stop watching"
    
    # Wait for user to press Ctrl+C
    trap "kill $watch_pid 2>/dev/null; log_info 'Watch mode stopped'; exit 0" INT
    wait $watch_pid
    
    return 0
}

# Run extension tests
test_extension() {
    log_step "Running extension tests..."
    cd "$EXTENSION_DIR"
    
    npm test
    
    if [ $? -eq 0 ]; then
        log_success "All tests passed"
        return 0
    else
        log_error "Tests failed"
        return 1
    fi
}

# Display the main menu
show_menu() {
    clear
    echo -e "${BOLD}${PURPLE}=== VSCode Extension Development Helper ===${RESET}"
    echo -e "${CYAN}Extension: ${EXTENSION_NAME}${RESET}"
    echo -e "${CYAN}Directory: ${EXTENSION_DIR}${RESET}"
    if [ -n "$VSCODE_CLI" ]; then
        echo -e "${CYAN}VSCode: ${VSCODE_CLI}${RESET}"
    fi
    echo
    echo -e "${BOLD}Available Actions:${RESET}"
    echo -e "${YELLOW}1)${RESET} Create New Extension"
    echo -e "${YELLOW}2)${RESET} Build Extension"
    echo -e "${YELLOW}3)${RESET} Package Extension (.vsix)"
    echo -e "${YELLOW}4)${RESET} Install Extension to VSCode"
    echo -e "${YELLOW}5)${RESET} Uninstall Extension from VSCode"
    echo -e "${YELLOW}6)${RESET} Run Extension in Debug Mode"
    echo -e "${YELLOW}7)${RESET} Watch for Changes (auto-rebuild)"
    echo -e "${YELLOW}8)${RESET} Run Extension Tests"
    echo -e "${YELLOW}0)${RESET} Exit"
    echo
    read -p "$(echo -e "${BOLD}Select an option:${RESET} ")" choice
    
    case $choice in
        1) create_extension ;;
        2) build_extension ;;
        3) package_extension ;;
        4) install_extension ;;
        5) uninstall_extension ;;
        6) debug_extension ;;
        7) watch_extension ;;
        8) test_extension ;;
        0) log_info "Exiting..."; exit 0 ;;
        *) log_error "Invalid option" ;;
    esac
    
    echo
    read -p "$(echo -e "${BOLD}Press Enter to continue...${RESET}")"
    show_menu
}

# Main execution
check_tools || exit 1
show_menu
