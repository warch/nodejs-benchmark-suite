@echo off
cd io-application
echo "install dependencies for io-application"
call npm install
cd ..
cd cpu-application
echo "install dependencies for cpu-application"
call npm install
cd ..
cd webserver-wrapper
echo "install dependencies for webserver-wrapper"
call npm install
cd ..
cd web-application
echo "install dependencies for web-application(ghost)"
call npm install --production
start npm start
cd ..
start node webserver-wrapper\app.js -a "node io-application\app.js" -p 8081
start node webserver-wrapper\app.js -a "node cpu-application\app.js" -p 8082