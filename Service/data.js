const 
{ allRandoms, allProducts, 
    allInfo, allLogin, 
    allRegister, allLoginError, 
    allRegisterUP, allData, 
    allLogOut,
    allNoImplementada
} = require("../persistence/data")

module.exports.getRandoms = async (quantity) => { 
    return await allRandoms(quantity);
}

module.exports.getProducts = async () => {
    return await allProducts();
}

module.exports.getInfo = async () => {
    return await allInfo();
}

module.exports.getLogin = async () => {
    return await allLogin();
}

module.exports.getRegister = async () => {
    return await allRegister();
}

module.exports.getLoginError = async () => {
    return await allLoginError();
}

module.exports.getRegisterUP = async ( nombre, password, direccion ) => {
    return await allRegisterUP( nombre, password, direccion );
}

module.exports.getData = async ( user, adress ) => {
    return await allData( user, adress );
}

module.exports.getLogOut = async () => {
    return await allLogOut();
}

module.exports.getNoImplementada = async (url, method) => {
    return await allNoImplementada(url, method);
}