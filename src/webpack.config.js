// webpack.config.js
const path = require('path');
const packageData = require('../package.json');
const TerserPlugin = require('terser-webpack-plugin');

class RemoveLicenseFilePlugin {
    apply(compiler) {
        compiler.hooks.emit.tap("RemoveLicenseFilePlugin", (compilation) => {
            for (let name in compilation.assets) {
                if (name.endsWith("LICENSE.txt")) {
                    delete compilation.assets[name];
                }
            }
        });
    }
}

// Shared settings between both builds
const baseConfig = {
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },
  plugins: [new RemoveLicenseFilePlugin()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
};

module.exports = [
  // --- Browser Build ---
  {
    ...baseConfig,
    name: 'browser',
    target: 'web',
    entry: './src/browser.js',
    output: {
      path: path.resolve(__dirname, '..', 'dist'),
      filename: 'browser.js',
      library: {
        type: 'module',
      },
    },
  },

  // --- Node Build ---
  {
    ...baseConfig,
    name: 'node',
    target: 'node',
    entry: './src/node.js',
    output: {
      path: path.resolve(__dirname, '..', 'dist'),
      filename: packageData.main.split("/").pop(),
      library: {
        type: 'module',
      },
    },
    // CRITICAL: Don't bundle linkedom into the Node build.
    // Node will require it at runtime from node_modules.
    externals: ['linkedom'],
  },
];
