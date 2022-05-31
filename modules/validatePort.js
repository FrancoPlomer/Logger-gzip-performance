module.exports.validatePort = (PORT) => {
    return PORT === 'cluster' ? 8081 : 8080;
}

