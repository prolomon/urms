const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Work around Metro resolving culori's ESM source entry on Windows.
// This forces packages to resolve through classic main/module fields.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
