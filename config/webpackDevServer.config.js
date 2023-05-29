'use strict';

const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const ignoredFiles = require('react-dev-utils/ignoredFiles');
const paths = require('./paths');
const fs = require('fs');

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const host = process.env.HOST || '0.0.0.0';

module.exports = function(proxy, allowedHost) {
    return {
        allowedHosts: "all",
        compress: true,
        hot: true,
        devMiddleware: {
            publicPath: "/"
        },
        static: {
            watch: true,
        },
        watchFiles: ['src/**/*'], // 监听 src 文件夹下的所有文件和子目录
        https: protocol === "https",
        host,
        historyApiFallback: {
            disableDotRule: true
        },
        client: {
            webSocketURL: {
                hostname: "0.0.0.0",
                pathname: "/",
                port: 3000
            },
            overlay: false,
            logging: "info"
        },
        proxy,
        onBeforeSetupMiddleware(devServer, server) {
            if (fs.existsSync(paths.proxySetup)) {
                // This registers user provided middleware for proxy reasons
                require(paths.proxySetup)(app);
            }
            devServer.app.use(evalSourceMapMiddleware(devServer));
            devServer.app.use(errorOverlayMiddleware());
            https: devServer.app.use(noopServiceWorkerMiddleware(""));
        }
    };
};

