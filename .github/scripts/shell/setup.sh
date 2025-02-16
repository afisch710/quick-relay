#!/bin/bash

# setup.sh

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Install GitHub CLI if not installed
if ! command_exists gh; then
  echo "GitHub CLI (gh) not found. Installing via Homebrew..."

  # Check if Homebrew is installed
  if ! command_exists brew; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for the current session
    if [ -d "/opt/homebrew/bin" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -d "/usr/local/bin" ]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
  fi

  # Install gh
  brew install gh
else
  echo "GitHub CLI (gh) is already installed."
fi

# Authenticate GitHub CLI if not authenticated
if ! gh auth status &> /dev/null; then
  echo "GitHub CLI is not authenticated. Starting authentication..."
  gh auth login
else
  echo "GitHub CLI is already authenticated."
fi

# Determine the repository root directory
repo_root=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$repo_root" ]; then
  echo "This script must be run inside a Git repository."
  exit 1
fi

# Define the path to the functions directory
functions_dir="$repo_root/.github/scripts/shell/functions"

# Check if functions directory exists
if [ ! -d "$functions_dir" ]; then
  echo "Functions directory not found at $functions_dir. Please ensure it exists."
  exit 1
fi

# Find all .sh scripts in the functions directory
function_scripts=("$functions_dir"/*.sh)

# Check if there are any .sh scripts
if [ ${#function_scripts[@]} -eq 0 ]; then
  echo "No function scripts found in $functions_dir."
  exit 1
fi

# Determine the absolute paths of all function scripts
source_commands=()
for script in "${function_scripts[@]}"; do
  if [ -f "$script" ]; then
    script_abs_path=$(realpath "$script")
    source_commands+=("source \"$script_abs_path\"")
  fi
done

# Determine the user's shell and profile file
current_shell=$(basename "$SHELL")

case "$current_shell" in
  bash)
    shell_profile="$HOME/.bash_profile"
    ;;
  zsh)
    shell_profile="$HOME/.zshrc"
    ;;
  *)
    echo "Unsupported shell: $current_shell. Please manually source the function scripts."
    exit 1
    ;;
esac

# Create the shell profile file if it doesn't exist
if [ ! -f "$shell_profile" ]; then
  touch "$shell_profile"
fi

# Add source commands to the shell profile if they are not already present
for source_command in "${source_commands[@]}"; do
  if ! grep -Fxq "$source_command" "$shell_profile"; then
    echo "Adding source command to $shell_profile:"
    echo "$source_command"
    echo "" >> "$shell_profile"
    echo "# Source function script: $(basename "$source_command" .sh)" >> "$shell_profile"
    echo "$source_command" >> "$shell_profile"
  else
    echo "Source command already exists in $shell_profile: $(basename "$source_command" .sh)"
  fi
done

# Reload the shell profile to apply changes
echo "Reloading shell profile..."
source "$shell_profile"

echo "Setup complete. Your custom Git functions are now available."