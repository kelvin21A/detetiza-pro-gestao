# Netlify Retry Plugin

A custom Netlify Build plugin to handle network-related errors during the build process.

## Purpose

This plugin is designed to prevent build failures due to transient network issues, specifically targeting the "Call retries were exceeded" error that can occur during Netlify builds.

## How it works

The plugin intercepts build errors and checks if they are network-related. If a network error is detected, the plugin will:

1. Log the error details
2. Attempt to recover from the error
3. Allow the build to continue instead of failing

## Installation

This plugin is installed locally in the project. The configuration in `netlify.toml` references the local plugin directory.

## Configuration

The plugin is configured in the `netlify.toml` file:

```toml
[[plugins]]
  package = "./netlify/plugins"
```

No additional inputs are required for this plugin.

## Plugin Structure

The plugin follows the Netlify Build plugin structure with:

- `manifest.yml` - Plugin metadata and configuration
- `index.js` - Plugin implementation
- `package.json` - Node.js package definition

## Development

To modify this plugin, edit the files in the `netlify/plugins` directory. Make sure to maintain the required structure for Netlify Build plugins.