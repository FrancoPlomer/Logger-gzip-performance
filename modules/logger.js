const winston = require('winston');

function buildProdLogger() {
    const prodLogger = winston.createLogger({
        transports: [
            new winston.transports.File({ filename: './loggers/debug.log', level: 'debug'}),
            new winston.transports.File({ filename: './loggers/error.log', level: 'error'}),
            new winston.transports.File({ filename: './loggers/warn.log' , level: 'warn'})
        ]
    })
    return prodLogger;
}

let logger = buildProdLogger();

module.exports = logger;