const logger = require("../modules/logger");
const 
{ 
    getRandoms, getProducts, 
    getInfo, getLogin, 
    getLoginError, getRegisterUP, 
    getData, getLogOut, getNoImplementada
} = require("../Service/data");

module.exports.getRandomsControllers = async ( req, res ) => {
    try 
    {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const quantity = req.query.cant;
        const datos = await getRandoms(quantity);
        res.send(datos);
    } catch (error) 
    {
        throw new Error(error)
    }
}

module.exports.getProductsTestControllers = async ( req, res ) => {
    try {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const datos = await getProducts();
        res.send(datos);
    } catch (error) {
        throw new Error(error)
    }
}

module.exports.getInfoController = async ( req, res ) => {
    try {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const datos = await getInfo();
        res.send(datos);
    } catch (error) {
        console.log(error)
    }
}

module.exports.getLoginController = async ( req, res ) => {
    try {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const datos = await getLogin();
        res.render(datos);
    } catch (error) {
        console.log(error)
    }
}

module.exports.getRegisterController = async ( req, res ) => {
    try {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const datos = await getRegister();
        res.render(datos);
    } catch (error) {
        console.log(error)
    }
}

module.exports.getLoginErrorController = async ( req, res ) => {
    try {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const datos = await getLoginError();
        res.render(datos);
    } catch (error) {
        console.log(error)
    }
}

module.exports.getRegisterUPController = async ( req, res ) => {
    try {
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const { nombre, password, direccion } = req.body;
        const datos = await getRegisterUP( nombre, password, direccion );

        if(datos === '/login') res.redirect(datos)
        else res.render(datos);
    } catch (error) {
        console.log(error)
    }
}

module.exports.getDataController = async ( req, res ) => {
    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
    const datos = await getData( req.user[0].user, req.user[0].adress );
    res.render(datos);
}

module.exports.getLogOutController = async ( req, res ) => {
    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
    const datos = await getLogOut();
    res.redirect(datos);
}

module.exports.getNoImplementadaController = async ( req, res ) => {
    const { url, method } = req;
    logger.warn(`Ruta ${method} ${url} no implementada`);
    const datos = await getNoImplementada(url, method);
    res.redirect(datos);
}