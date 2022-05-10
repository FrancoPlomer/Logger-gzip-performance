const winston = require('winston');

function buildProdLogger() {
    const prodLogger = winston.createLogger({
        transports: [
            new winston.transports.File({ filename: 'debug.log', level: 'debug'}),
            new winston.transports.File({ filename: 'error.log', level: 'error'}),
            new winston.transports.File({ filename: 'warn.log' , level: 'warn'})
        ]
    })
    return prodLogger;
}

let logger = buildProdLogger();

module.exports = logger;