const config = require("../config");
const users = require("../models/users");
const { generateRandoms, sortNumber } = require("../modules/utils");
const bcrypt = require("bcrypt");


module.exports.allRandoms = (quantity) => {
    let arrayOfNumbers = [];
    let numActual = null;
    let count = 0;
    let repeats = {};
    const randomGenerate = generateRandoms(quantity);
    arrayOfNumbers = randomGenerate;
    arrayOfNumbers.sort(sortNumber);
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        if (arrayOfNumbers[i] != numActual) {
            if (count > 0) {
                if(repeats[arrayOfNumbers[i]])
                {
                    repeats[arrayOfNumbers[i]] = count;
                }
                else{
                    repeats[arrayOfNumbers[i]] = count;
                }
            }
            numActual = arrayOfNumbers[i];
            count = 1;
        } else {
            count++;
        }
    }
    return repeats;
}

module.exports.allProducts = () => {
    let allOfMyProducts;
    for(let i = 0; i < 5; i++)
    {   
        allOfMyProducts = generarCombinacion(i);
    }
    return allOfMyProducts;
}

module.exports.allInfo = () => {
    return config.systemIfo;
}

module.exports.allLogin = () => {
    return 'login'
}

module.exports.allRegister = () => {
    return 'register'
}

module.exports.allLoginError = () => {
    return 'login-error'
}

module.exports.allRegisterUP = async ( nombre, password, direccion ) => {
    const [newUser] = await users.find({user: nombre})

    if (newUser) {
        return 'register-error';
    } else {
        bcrypt.hash(password, 5, async function(err, hash) {
            const newUserToAddModel = new users({
                user: nombre,
                pass: hash,
                adress: direccion
            });
            await newUserToAddModel.save()
        });
        return '/login';
    }
}

module.exports.allData = ( user, adress ) => {
    const infoUser = {
        user: user,
        adress: adress
    }

    return ('datos', {datos: infoUser});
}

module.exports.allNoImplementada = (url, method) => {
    return `Ruta ${method} ${url} no implementada`;
}