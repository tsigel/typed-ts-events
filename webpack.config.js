const { resolve, join } = require('path');

const getGeneralConfig = (minimize, production) => ({
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader'
                },
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: ['node_modules']
    },
    mode: production ? "production" : "development",
    devtool: production ? "source-map" : "inline-source-map",
})

const buildLibrary = (minimize, production) => ({
    ...getGeneralConfig(minimize, production),
    entry: join(__dirname, 'src/index.ts'),
    optimization: {
        minimize,
        usedExports: true,
    },
    output: {
        library: 'EventEmitter',
        libraryTarget: "umd",
        globalObject: "this",
        filename: `events${minimize ? '.min' : ''}.js`,
        path: resolve(__dirname, 'dist'),
    }
});

module.exports = [
    buildLibrary(true, true),
    buildLibrary(false, true)
];
