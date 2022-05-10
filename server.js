const express = require('express');
const bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Strategy } = require("passport-local");
const exphbs = require("express-handlebars");
const path = require("path");
const passport = require("passport");
const config = require('./config');
const messages = require('./models/mensajes');
const users = require('./models/users');
const mongoose = require("mongoose");
const util = require('util');
const { normalizeMessages, messageDenormalize } = require('./modules/normalize');
const LocalStrategy = Strategy;
const { faker } = require('@faker-js/faker');
const { Server: IOServer } = require('socket.io');
const { Server: HttpServer} = require('http');
const bcrypt = require("bcrypt");
const parseArgs = require("minimist");
const { fork } = require("child_process");
const { exec } = require("child_process");
const cluster = require("cluster");
const numCPUs = require('os').cpus().length;
const http = require('http');
const compression = require("compression");
const logger = require('./logger');
const puerto = parseArgs(process.argv.slice(2));
const PORT = validatePort(puerto["modo"]);



function isAuth(req, res, next) {
    if(req.isAuthenticated()){
        next()
    } else {
        res.redirect('/login')
    }
}

function validatePort (PORT) {
    return PORT === 'cluster' ? 8081 : 8080;
}

function print(objeto) {
    console.log(util.inspect(objeto, false, 12, true))
}

function generarCombinacion (id) {
    return {
        id,
        name: faker.commerce.product(),
        price: faker.commerce.price(100),
        stock: faker.datatype.number({ min: 1000000 }),
        url: faker.image.image(),
    }
}

function sortNumber(a,b) {
    return a - b;
}

function generateRandoms (quantity) {
    let arrayOfNumbers = [];
    for (let index = 0; index < quantity; index++) {
        arrayOfNumbers.push(parseInt(Math.random() * (1001 - 1) + 1))
    }
    return arrayOfNumbers;
}



async function addMessages(message) {
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


if(PORT === 8081 && puerto["puerto"] === 8080){
    if(cluster.isMaster) {
        console.log(numCPUs);
        console.log(`PID MASTER ${process.pid}`);
    
        for(let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
    
        cluster.on('exit', worker => {
            console.log('WORKER', worker.process.id, 'died', new Date().toLocaleString())
            cluster.fork()
        })
    }
    else{
            const app = express();
            const app2 = express();
            const httpServer = new HttpServer(app);
            const io = new IOServer(httpServer);
            let mensajes = {}
            let productos = {}
            let id = 0;
            const uri = config.mongoRemote.cnxStr;
    
            passport.use(new LocalStrategy(
                async (username, password, done)=>{
                    const [existeUsuario] = await users.find({user: username})
                    const result = bcrypt.compareSync(password, existeUsuario.pass);
                    if (!existeUsuario) {
                        console.log('Usuario no encontrado')
                        return done(null, false);
                    }
    
                    if(!result){
                        console.log('Contrase;a invalida')
                        return done(null, false);
                    }
    
                    return done(null, existeUsuario);
                }
            ))
            passport.serializeUser((usuario, done)=>{
                done(null, usuario.user);
            })
    
            passport.deserializeUser(async (nombre, done)=>{
                const usuario = await users.find({user: nombre})
                done(null, usuario);
            });
    
            /*----------- Session -----------*/
            app.use(cookieParser());
            app.use(session({
                secret: `${process.env.SECRET}`,
                resave: false,
                saveUninitialized: false,
                cookie: {
                    maxAge: 20000 //20 seg
                }
            }))
    
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(compression());
    
            app.set('views','./views');
            app.engine('.hbs', exphbs.engine({
                defaultLayout: 'main',
                layoutsDir: path.join(app.get('views'), 'layouts'),
                extname: '.hbs'
            }));
            mongoose.connect(uri, config.mongoRemote.client)
            app.set('view engine', '.hbs');
    
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(express.json())
            app2.get('/api/randoms', async(req, res) => {
                try {
                    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                    const quantity = req.query.cant;
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
                    res.send(repeats);
                } catch (error) {
                    logger.error(`A ocurrido el siguiente error: ${error}`)
                    throw new Error(error)
                }
            })
            app.get('/api/productos-test', async(req, res) => {
                try {
                    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                    let allOfMyProducts;
                    for(let i = 0; i < 5; i++)
                    {   
                        allOfMyProducts = generarCombinacion(i);
                    }
                    res.json(allOfMyProducts);
                } catch (error) {
                    logger.error(`A ocurrido el siguiente error: ${error}`)
                    throw new Error(error)
                }
            })
            
            
            app.get('/', (req, res)=>{
                if (req.session.user) {
                    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                    res.redirect('/datos')
                } else {
                    res.redirect('/login')
                }
            })
            app.get('/info', compression(), (req, res)=>{
                try {
                    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                    res.json(config.systemIfo)
                } catch (error) {
                    
                }
            })
            
            app.get('/login', (req, res)=>{
                logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                res.render('login');
            })
            
            app.post('/login', passport.authenticate('local', 
                {
                    successRedirect: '/datos',
                    failureRedirect: '/login-error'
                }
            ))
            
            app.get('/register', (req, res)=>{
                logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                res.render('register');
            })
            
            app.get('/login-error', (req, res)=>{
                logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                res.render('login-error');
            })
            app.post('/register', async (req, res)=>{
                logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                const {nombre, password, direccion } = req.body;
                const [newUser] = await users.find({user: nombre})
            
                if (newUser) {
                    res.render('register-error')
                } else {
                    bcrypt.hash(password, 5, async function(err, hash) {
                        const newUserToAddModel = new users({
                            user: nombre,
                            pass: hash,
                            adress: direccion
                        });
                        await newUserToAddModel.save()
                    });
                    res.redirect('/login')
                }
            });
            
            app.get('/datos', isAuth, (req, res)=>{
                logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                const infoUser = {
                    user: req.user[0].user,
                    adress: req.user[0].adress
                }
                res.render('datos', {datos: infoUser});
            });
            
            
            app.get('/logout', (req, res)=>{
                logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
                req.logOut();
                res.redirect('/');
            });

            app.get('*', (req, res) => {
                const { url, method } = req;
                logger.warn(`Ruta ${method} ${url} no implementada`);
                res.send(`Ruta ${method} ${url} no implementada`);
            })
            
            io.on('connection', (socket) => {
                console.log("Usuario conectado");
                socket.emit('Bienvenido','Hola usuario.')
                socket.on('producto', async(data) => {
                    let allOfProducts = [];
                    productos = {
                        name: data.name,
                        price: data.price,
                        url: data.url,
                    }
                    allOfProducts = [...allOfProducts, productos]
                    allOfProducts.map((product) =>
                    {
                        io.sockets.emit('productos', product);
                    }
                    )
                })
                socket.on('systemData', async(data) => {      
                    io.sockets.emit('systemDatas', {
                        params: puerto,
                        operativeSystem: data.operativeSystem,
                        nodeVersion: data.nodeVersion,
                        rss: data.rss,
                        execPath: data.execPath,
                        pid: data.pid,
                        fileProyect: data.fileProyect,
                        cpuQuantity: numCpus
                    });
                })
                socket.on('aleatory', async(data) => {      
                    io.sockets.emit('aleatorys', data);
                })
                socket.on('usuario', data => {
                    id+=1
                    mensajes = {
                        ... mensajes,
                        author:{
                            id: String(id),
                            nombre: data,
                            apellido: faker.name.lastName(),
                            edad: faker.datatype.number({ max: 100 }),
                            alias: faker.name.jobTitle(),
                            avatar: faker.image.image()
                        }
                    } 
                    io.sockets.emit('usuarios', data);
                })
                socket.on('mensaje', async(data) => {
                    const newMessage = {
                        mensaje: data
                    }
                    let toNormalice = {
                        autores: [],
                        mensajes: []
                    }
                    let AllofMyMessages = await addMessages(newMessage);
                    let normalizedComments;
                    let denormalizedComments;
                    AllofMyMessages.map((message) =>
                    {
                        const filter = toNormalice.autores.find(autor => autor.id === message.author.id);
                        if(!filter){
                            toNormalice.autores.push(message.author)
                        }
                        toNormalice.mensajes.push(message.text)
                    })
                    normalizedComments = normalizeMessages(toNormalice)
                    denormalizedComments = messageDenormalize(normalizedComments)
                    io.sockets.emit('mensajes', normalizedComments.entities.messages.undefined);
                    print(denormalizedComments)
                })
            })
            app2.listen(8081, err => {
                if (!err) console.log("Servidor escuchando")
            })
            app.listen(8080, err => {
                if (!err) console.log("Servidor escuchando")
            })
    }

}


else if(PORT === 8081 && puerto["puerto"] !== 8080){
    exec('pm2 start server.js --name="Server2" --watch -i max -- 8081', async (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`ejecutando servidor con Cluster: ${stdout}`);
    });
    const app = express();
    const httpServer = new HttpServer(app);
    const io = new IOServer(httpServer);
    let mensajes = {}
    let productos = {}
    let id = 0;
    const uri = config.mongoRemote.cnxStr;

    passport.use(new LocalStrategy(
        async (username, password, done)=>{
            const [existeUsuario] = await users.find({user: username})
            const result = bcrypt.compareSync(password, existeUsuario.pass);
            if (!existeUsuario) {
                console.log('Usuario no encontrado')
                return done(null, false);
            }

            if(!result){
                console.log('Contrase;a invalida')
                return done(null, false);
            }

            return done(null, existeUsuario);
        }
    ))
    passport.serializeUser((usuario, done)=>{
        done(null, usuario.user);
    })

    passport.deserializeUser(async (nombre, done)=>{
        const usuario = await users.find({user: nombre})
        done(null, usuario);
    });

    /*----------- Session -----------*/
    app.use(cookieParser());
    app.use(session({
        secret: `${process.env.SECRET}`,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 20000 //20 seg
        }
    }))

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(compression());


    app.set('views','./views');
    app.engine('.hbs', exphbs.engine({
        defaultLayout: 'main',
        layoutsDir: path.join(app.get('views'), 'layouts'),
        extname: '.hbs'
    }));
    mongoose.connect(uri, config.mongoRemote.client)
    app.set('view engine', '.hbs');

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.json())
    app.get('/api/randoms', async(req, res) => {
        try {
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
            const quantity = req.query.cant;
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
            res.send(repeats);
        } catch (error) {
            logger.error(`A ocurrido el siguiente error: ${error}`)
            throw new Error(error)
        }
    })
    app.get('/api/productos-test', async(req, res) => {
        try {
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
            let allOfMyProducts;
            for(let i = 0; i < 5; i++)
            {   
                allOfMyProducts = generarCombinacion(i);
            }
            res.json(allOfMyProducts);
        } catch (error) {
            logger.error(`A ocurrido el siguiente error: ${error}`)
            throw new Error(error)
        }
    })
    
    
    app.get('/', (req, res)=>{
        if (req.session.user) {
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
            res.redirect('/datos')
        } else {
            res.redirect('/login')
        }
    })
    app.get('/info', compression(), (req, res)=>{
        try {
            res.json(config.systemIfo)
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        } catch (error) {
            console.log(error)
        }
    })
    
    app.get('/login', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        res.render('login');
    })
    
    app.post('/login', passport.authenticate('local', 
        {
            successRedirect: '/datos',
            failureRedirect: '/login-error'
        }
    ))
    
    app.get('/register', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        res.render('register');
    })
    
    app.get('/login-error', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        res.render('login-error');
    })
    app.post('/register', async (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const {nombre, password, direccion } = req.body;
        const [newUser] = await users.find({user: nombre})
    
        if (newUser) {
            res.render('register-error')
        } else {
            bcrypt.hash(password, 5, async function(err, hash) {
                const newUserToAddModel = new users({
                    user: nombre,
                    pass: hash,
                    adress: direccion
                });
                await newUserToAddModel.save()
            });
            res.redirect('/login')
        }
    });
    
    app.get('/datos', isAuth, (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const infoUser = {
            user: req.user[0].user,
            adress: req.user[0].adress
        }
        res.render('datos', {datos: infoUser});
    });
    
    
    app.get('/logout', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        req.logOut();
        res.redirect('/');
    });

    app.get('*', (req, res) => {
        const { url, method } = req;
        logger.warn(`Ruta ${method} ${url} no implementada`);
        res.send(`Ruta ${method} ${url} no implementada`);
    })
    
    io.on('connection', (socket) => {
        console.log("Usuario conectado");
        socket.emit('Bienvenido','Hola usuario.')
        socket.on('producto', async(data) => {
            let allOfProducts = [];
            productos = {
                name: data.name,
                price: data.price,
                url: data.url,
            }
            allOfProducts = [...allOfProducts, productos]
            allOfProducts.map((product) =>
            {
                io.sockets.emit('productos', product);
            }
            )
        })
        socket.on('systemData', async(data) => {      
            io.sockets.emit('systemDatas', {
                params: puerto,
                operativeSystem: data.operativeSystem,
                nodeVersion: data.nodeVersion,
                rss: data.rss,
                execPath: data.execPath,
                pid: data.pid,
                fileProyect: data.fileProyect,
                cpuQuantity: numCPUs
            });
        })
        socket.on('aleatory', async(data) => {      
            io.sockets.emit('aleatorys', data);
        })
        socket.on('usuario', data => {
            id+=1
            mensajes = {
                ... mensajes,
                author:{
                    id: String(id),
                    nombre: data,
                    apellido: faker.name.lastName(),
                    edad: faker.datatype.number({ max: 100 }),
                    alias: faker.name.jobTitle(),
                    avatar: faker.image.image()
                }
            } 
            io.sockets.emit('usuarios', data);
        })
        socket.on('mensaje', async(data) => {
            const newMessage = {
                mensaje: data
            }
            let toNormalice = {
                autores: [],
                mensajes: []
            }
            let AllofMyMessages = await addMessages(newMessage);
            let normalizedComments;
            let denormalizedComments;
            AllofMyMessages.map((message) =>
            {
                const filter = toNormalice.autores.find(autor => autor.id === message.author.id);
                if(!filter){
                    toNormalice.autores.push(message.author)
                }
                toNormalice.mensajes.push(message.text)
            })
            normalizedComments = normalizeMessages(toNormalice)
            denormalizedComments = messageDenormalize(normalizedComments)
            io.sockets.emit('mensajes', normalizedComments.entities.messages.undefined);
            print(denormalizedComments)
        })
    })
    app.listen(PORT, err => {
        if (!err) console.log("Servidor escuchando")
    })
}
else{
    exec('pm2 start server.js --name="Server1" --watch -- 8080', async (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`ejecutando servidor con FORK: ${stdout}`);
    });
    const app = express();
    const httpServer = new HttpServer(app);
    const io = new IOServer(httpServer);
    let mensajes = {}
    let productos = {}
    let id = 0;
    const uri = config.mongoRemote.cnxStr;

    passport.use(new LocalStrategy(
        async (username, password, done)=>{
            const [existeUsuario] = await users.find({user: username})
            const result = bcrypt.compareSync(password, existeUsuario.pass);
            if (!existeUsuario) {
                console.log('Usuario no encontrado')
                return done(null, false);
            }

            if(!result){
                console.log('Contrase;a invalida')
                return done(null, false);
            }

            return done(null, existeUsuario);
        }
    ))
    passport.serializeUser((usuario, done)=>{
        done(null, usuario.user);
    })

    passport.deserializeUser(async (nombre, done)=>{
        const usuario = await users.find({user: nombre})
        done(null, usuario);
    });

    /*----------- Session -----------*/
    app.use(cookieParser());
    app.use(session({
        secret: `${process.env.SECRET}`,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 20000 //20 seg
        }
    }))

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(compression());


    app.set('views','./views');
    app.engine('.hbs', exphbs.engine({
        defaultLayout: 'main',
        layoutsDir: path.join(app.get('views'), 'layouts'),
        extname: '.hbs'
    }));
    mongoose.connect(uri, config.mongoRemote.client)
    app.set('view engine', '.hbs');

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.json())
    app.get('/api/randoms', async(req, res) => {
        try {
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
            const quantity = req.query.cant;
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
            res.send(repeats);
        } catch (error) {
            logger.error(`A ocurrido el siguiente error: ${error}`)
            throw new Error(error)
        }
    })
    app.get('/api/productos-test', async(req, res) => {
        try {
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
            let allOfMyProducts;
            for(let i = 0; i < 5; i++)
            {   
                allOfMyProducts = generarCombinacion(i);
            }
            res.json(allOfMyProducts);
        } catch (error) {
            throw new Error(error)
        }
    })
    
    
    app.get('/', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        if (req.session.user) {
            res.redirect('/datos')
        } else {
            res.redirect('/login')
        }
    })
    app.get('/info', compression(), (req, res)=>{
        try {
            logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
            res.json(config.systemIfo)
        } catch (error) {
            console.log(error)
        }
    })
    
    app.get('/login', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        res.render('login');
    })
    
    app.post('/login', passport.authenticate('local', 
        {
            successRedirect: '/datos',
            failureRedirect: '/login-error'
        }
    ))
    
    app.get('/register', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        res.render('register');
    })
    
    app.get('/login-error', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        res.render('login-error');
    })
    app.post('/register', async (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const {nombre, password, direccion } = req.body;
        const [newUser] = await users.find({user: nombre})
    
        if (newUser) {
            res.render('register-error')
        } else {
            bcrypt.hash(password, 5, async function(err, hash) {
                const newUserToAddModel = new users({
                    user: nombre,
                    pass: hash,
                    adress: direccion
                });
                await newUserToAddModel.save()
            });
            res.redirect('/login')
        }
    });
    
    app.get('/datos', isAuth, (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        const infoUser = {
            user: req.user[0].user,
            adress: req.user[0].adress
        }
        res.render('datos', {datos: infoUser});
    });
    
    
    app.get('/logout', (req, res)=>{
        logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
        req.logOut();
        res.redirect('/');
    });

    app.get('*', (req, res) => {
        const { url, method } = req;
        logger.warn(`Ruta ${method} ${url} no implementada`);
        res.send(`Ruta ${method} ${url} no implementada`);
    })
    
    io.on('connection', (socket) => {
        console.log("Usuario conectado");
        socket.emit('Bienvenido','Hola usuario.')
        socket.on('producto', async(data) => {
            let allOfProducts = [];
            productos = {
                name: data.name,
                price: data.price,
                url: data.url,
            }
            allOfProducts = [...allOfProducts, productos]
            allOfProducts.map((product) =>
            {
                io.sockets.emit('productos', product);
            }
            )
        })
        socket.on('systemData', async(data) => {      
            io.sockets.emit('systemDatas', {
                params: puerto,
                operativeSystem: data.operativeSystem,
                nodeVersion: data.nodeVersion,
                rss: data.rss,
                execPath: data.execPath,
                pid: data.pid,
                fileProyect: data.fileProyect,
                cpuQuantity: numCpus
            });
        })
        socket.on('aleatory', async(data) => {      
            io.sockets.emit('aleatorys', data);
        })
        socket.on('usuario', data => {
            id+=1
            mensajes = {
                ... mensajes,
                author:{
                    id: String(id),
                    nombre: data,
                    apellido: faker.name.lastName(),
                    edad: faker.datatype.number({ max: 100 }),
                    alias: faker.name.jobTitle(),
                    avatar: faker.image.image()
                }
            } 
            io.sockets.emit('usuarios', data);
        })
        socket.on('mensaje', async(data) => {
            const newMessage = {
                mensaje: data
            }
            let toNormalice = {
                autores: [],
                mensajes: []
            }
            let AllofMyMessages = await addMessages(newMessage);
            let normalizedComments;
            let denormalizedComments;
            AllofMyMessages.map((message) =>
            {
                const filter = toNormalice.autores.find(autor => autor.id === message.author.id);
                if(!filter){
                    toNormalice.autores.push(message.author)
                }
                toNormalice.mensajes.push(message.text)
            })
            normalizedComments = normalizeMessages(toNormalice)
            denormalizedComments = messageDenormalize(normalizedComments)
            io.sockets.emit('mensajes', normalizedComments.entities.messages.undefined);
            print(denormalizedComments)
        })
    })
    app.listen(PORT, err => {
        if (!err) console.log("Servidor escuchando")
    })
}






