const { app: electronApp, Menu, Tray } = require('electron');
const path = require('path');

const { readFile } = require('fs').promises;
const express = require('express');
const cors = require('cors');

const { keyboard, Key } = require('@nut-tree/nut-js');
keyboard.config.autoDelayMs = 5;





let tray = null;

electronApp.whenReady().then(() => {
    // Tray
    const icon = path.join(__dirname, '../../images/icon.png');
    tray = new Tray(icon);
    tray.setToolTip('Keyboard over Network');   
    setTray();

    // Network
    checkConnectionStatus();
    setInterval(() => { 
        checkConnectionStatus();
        setTray();
    }, 10000);

    // App
    startExpressApp();
});





// Tray

function setTray() {
    const contextMenu = Menu.buildFromTemplate([ 
        { label: `IP: ${IP_ADDRESS}` }, 
        { label: `PORT: ${PORT}` }, 
        { label: 'Shutdown', click: () => electronApp.exit() }
    ]);
    
    tray.setContextMenu(contextMenu);
}





// Network

let IP_ADDRESS = 'No Router';
let PORT = 6969;

function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
  
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
          return alias.address;
      }
    }
    return '0.0.0.0';
}

function checkConnectionStatus() {
    let NEW_IP_ADDRESS = getIPAddress();

    if (NEW_IP_ADDRESS === '0.0.0.0') {
        console.log('No connection to router detected.');
        IP_ADDRESS = 'No Router';
        return false;
    }

    if (IP_ADDRESS === NEW_IP_ADDRESS) {
        return false
    }

    IP_ADDRESS = NEW_IP_ADDRESS;
    if (expressApp) {
        expressApp.listen(PORT, IP_ADDRESS, () => console.log(`App available at http://${IP_ADDRESS}:${PORT}.`));
    }
    return true;
}




let expressApp;

function startExpressApp() {
    expressApp = express();
    expressApp.use(express.text());
    expressApp.use(express.urlencoded({ extended: true }));
    expressApp.use(express.static(path.join(__dirname, '../client')));
    expressApp.use( cors({ origin: '*' }) );

    expressApp.listen(PORT, IP_ADDRESS, () => console.log(`App available at http://${IP_ADDRESS}:${PORT}.`));

    expressApp.get('/', (request, response) => {
        response.sendFile(path.join(__dirname, '../client/client.html'), 'text/html');
    });
    
    expressApp.post('/input', async (request, response) => {
        console.log(request.body);
    
        await keyboard.type(request.body);
    
        response.sendStatus(200);
    });
    
    expressApp.post('/enter', async (request, response) => {
        console.log('Enter');
    
        await keyboard.pressKey(Key.Enter);
        await keyboard.releaseKey(Key.Enter);
    
        response.sendStatus(200);
    });
    
    
    expressApp.post('/backspace', async (request, response) => {
        console.log('Backspace');
    
        await keyboard.pressKey(Key.Backspace);
        await keyboard.releaseKey(Key.Backspace);
    
        response.sendStatus(200);
    });
}
