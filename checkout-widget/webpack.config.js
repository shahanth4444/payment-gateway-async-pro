const path = require('path');

module.exports = {
    entry: './src/sdk/PaymentGateway.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'checkout.js',
        library: {
            name: 'PaymentGateway',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};
