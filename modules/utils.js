const { faker } = require('@faker-js/faker');
const { Server: IOServer } = require('socket.io');
const messages = require('../models/mensajes');


let mensajes = {}
let productos = {}
let id = 0;

module.exports.addMessages = async (message) => {
    const newMessage = message.mensaje;
    mensaje = {
        ... mensajes,
        text: {
            id: String(id),
            message: newMessage
        }
    }
    const newMessageToAddModel = new messages(mensaje);
    const newMessageAdded = await newMessageToAddModel.save()
        .then(async () => {
            console.log("message inserted")
            async function allMessages () {
                const allOfMyMessagesMongo = await messages.find()
                .then((rows) => {
                    const MessagesTotal = rows.reduce((rowacc, row) => 
                    {
                        return rowacc = [...rowacc, row]
                    }
                    , [])
                    return MessagesTotal;
                })
                .catch((err) => console.log(err))       
                
                return allOfMyMessagesMongo;
            }
            const totalMessages = await allMessages();
            return totalMessages;
        }).catch((err) => {
            logger.error(`A ocurrido el siguiente error: ${err}`)
            console.log(err)
        })
        
    return newMessageAdded;
}

module.exports.print = (objeto) => {
    console.log(util.inspect(objeto, false, 12, true))
}

module.exports.generarCombinacion = (id) => {
    return {
        id,
        name: faker.commerce.product(),
        price: faker.commerce.price(100),
        stock: faker.datatype.number({ min: 1000000 }),
        url: faker.image.image(),
    }
}

module.exports.sortNumber = (a,b) => {
    return a - b;
}

module.exports.generateRandoms = (quantity) => {
    let arrayOfNumbers = [];
    for (let index = 0; index < quantity; index++) {
        arrayOfNumbers.push(parseInt(Math.random() * (1001 - 1) + 1))
    }
    return arrayOfNumbers;
}

const isAuth = (req, res, next) => {
    if(req.isAuthenticated()){
        next()
    } else {
        res.redirect('/login')
    }
}

module.exports = {mensajes, productos, id}