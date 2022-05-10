#Modo cluster nativo:
node server.js --modo cluster --puerto 8080

#Modo cluster:
node server.js --modo cluster

#Modo fork
npm start

#Procesos forever:
forever list

#Listado de procesos:
tasklist

#Listado de procesos pm2:
pm2 list

#matar todos los procesos:
npm stop

#Profiling de node
node --prof server.js

#Test de carga con artillery sobre info
artillery quick --count 50 -n 20 "http://localhost:8080/info" > result_bloq.txt

#Generar grafico flama interactivo
0x server.js

#Test de carga con autocannon
npm test