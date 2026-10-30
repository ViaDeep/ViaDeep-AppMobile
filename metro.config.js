const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// El modelo LMD-YOLO se empaqueta con la app como un archivo más.
config.resolver.assetExts.push('onnx');

module.exports = config;
