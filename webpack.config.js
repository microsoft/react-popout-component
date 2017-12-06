const path = require('path');

module.exports = {
    entry: './test/test.tsx',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'test'),
        publicPath: 'test',
        devtoolModuleFilenameTemplate: 'http://localhost:8080/[resource-path]',
    },
};
