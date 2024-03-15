const { app, Menu, Tray } = require('electron');
const path = require('path');

const { readFile } = require('fs').promises;
const express = require('express');
const cors = require('cors');

const nodeCmd = require('node-cmd');





const expressApp = express();
expressApp.use(express.text());
expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(express.static(path.join(__dirname, '../client')));
expressApp.use( cors({ origin: '*' }) );





let icon = '';
let tray = null;

app.whenReady().then(() => {
    icon = path.join(__dirname, '../../images/icon.png');
    tray = new Tray(icon);
    tray.setToolTip('Phone Keyboard to Balabolka');
    
    setTray();
});





function setTray() {
    const contextMenu = Menu.buildFromTemplate([ 
        { label: `IP: ${IP_ADDRESS}` }, 
        { label: `PORT: ${PORT}` }, 
        { label: 'Shutdown', click: () => app.exit() }
    ]);
    
    tray.setContextMenu(contextMenu);
}





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





let IP_ADDRESS = 'No Router';
let PORT = 80;





checkConnectionStatus();
setInterval(() => { 
    checkConnectionStatus();
    setTray();
}, 10000);





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
    expressApp.listen(PORT, IP_ADDRESS, () => console.log(`App available at http://${IP_ADDRESS}:${PORT}.`));
    return true;
}





expressApp.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, '../client/client.html'), 'text/html');
});

expressApp.post('/input', async (request, response) => {
    console.log(request.body);

    nodeCmd.run(
        `balcon.exe -n "IVONA 2 Amy OEM" -t "${request.body}" -s 0 -v 100`, 
        (err, data, stderr) => console.log(data)
    );

    response.sendStatus(200);
});
