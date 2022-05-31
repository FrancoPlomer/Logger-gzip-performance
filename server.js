const express = require('express');
const bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Strategy } = require("passport-local");
const exphbs = require("express-handlebars");
const path = require("path");
const passport = require("passport");
const config = require('./config');
const users = require('./models/users');
const mongoose = require("mongoose");
const { normalizeMessages, messageDenormalize } = require('./modules/normalize');
const LocalStrategy = Strategy;
const { faker } = require('@faker-js/faker');
const { Server: IOServer } = require('socket.io');
const { Server: HttpServer} = require('http');
const bcrypt = require("bcrypt");
const parseArgs = require("minimist");
const compression = require("compression");
const logger = require('./modules/logger');
const { validatePort } = require('./modules/validatePort');

const { print, generarCombinacion, sortNumber, generateRandoms, mensajes, productos, id, addMessages } = require('./persistence/data');
const { routerDatos } = require('./Router/routes');
const puerto = parseArgs(process.argv.slice(2));
const PORT = validatePort(puerto["modo"]);


const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
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
app.use(express.json());
app.use('/api', routerDatos)




app.get('/', (req, res)=>{
    logger.info(`Usted ingreso a la ruta: ${req.route.path}. \n La peticion es del tipo: ${req.method}`)
    if (req.session.user) {
        res.redirect('/datos')
    } else {
        res.redirect('/login')
    }
})


app.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/datos',
        failureRedirect: '/login-error'
    }
))



app.listen(PORT, err => {
    if (!err) console.log("Servidor escuchando")
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





