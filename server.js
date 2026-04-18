const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const nodemailer = require('nodemailer');
const xss = require('xss');
const bonjour = require('bonjour')();
const discoveredDevices = new Map();
let currentServerId = null;
const fs = require('fs').promises;


const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use(express.static("client"));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/pages/home.html'));
});

app.get('/data', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'server/json/data.json');
        const data = await fs.readFile(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).send('Error reading data');
    }
});

app.post('/predict', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'server/json/data.json');
        let currentData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
        if (!currentData.servers[currentServerId]) {
            currentData.servers[currentServerId] = { stats: {}, alerts: [] };
        }
        currentData.servers[currentServerId].stats = { ...currentData.servers[currentServerId].stats, ...req.body };
        if (req.body.predicted_class > 0) {
            currentData.servers[currentServerId].alerts.push({
                message: `Disaster predicted: class ${req.body.predicted_class}`,
                confidence: req.body.confidence,
                timestamp: new Date().toISOString()
            });
        }
        await fs.writeFile(dataPath, JSON.stringify(currentData, null, 2));

        // Send to hub if not hub
        const configPath = path.join(__dirname, 'server/json/serverconfig.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        if (currentServerId !== config.hub) {
            const hubAddr = config.hubAddress;
            if (hubAddr) {
                const postData = JSON.stringify({
                    serverId: currentServerId,
                    data: currentData.servers[currentServerId]
                });
                const options = {
                    hostname: hubAddr.split(':')[0],
                    port: hubAddr.split(':')[1],
                    path: '/updateData',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };
                const reqHub = http.request(options, (res) => {
                    // ignore response
                });
                reqHub.on('error', (err) => {
                    console.error('Error sending to hub:', err);
                });
                reqHub.write(postData);
                reqHub.end();
            }
        }

        res.send('Data updated');
    } catch (err) {
        res.status(500).send('Error updating data');
    }
});

app.post('/updateData', express.json(), async (req, res) => {
    try {
        const { serverId, data } = req.body;
        const dataPath = path.join(__dirname, 'server/json/data.json');
        const currentData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
        currentData.servers[serverId] = data;
        await fs.writeFile(dataPath, JSON.stringify(currentData, null, 2));
        res.send('Data updated');
    } catch (err) {
        res.status(500).send('Error updating data');
    }
});

io.on('connection', (socket) => {
    socket.on('checkConfig', async (data, callback) => {
        try {
            const configPath = path.join(__dirname, 'server/json/serverconfig.json');
            const jsonData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(jsonData);
            callback(config.hub ? 'set up' : 'not set up');
        } catch (err) {
            callback('not set up');
        }
    });

    socket.on('updateConfig', async (data) => {
        try {
            const configPath = path.join(__dirname, 'server/json/serverconfig.json');
            await fs.writeFile(configPath, JSON.stringify(data.config, null, 2));
        } catch (err) {
            console.error('Error updating config:', err);
        }
    });

    socket.on('sendConfirmationEmail', (package, user) => {
       
    });
    socket.on('loadServer', async (data) => {
        const discovered = [];

        bonjour.find({ type: 'node-server' }, function (service) {
            const id = service.name;
            const address = service.referer.address + ':' + service.port;
            discoveredDevices.set(id, address);
            discovered.push({ id, address });
        });
        const configPath = path.join(__dirname, 'server/json/serverconfig.json');
        let config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        config.servers = config.servers || [];

        // If hub not set or not connected, set this as hub
        if (!config.hub || !discoveredDevices.has(config.hub)) {
            config.hub = data.serverId;
        }

        config.hubAddress = discoveredDevices.get(config.hub);

        currentServerId = data.serverId;

        // Add this server to servers if not already
        if (!config.servers.find(s => s.id === data.serverId)) {
            config.servers.push({ id: data.serverId });
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        // Send update to other servers
        for (const [otherId, _addr] of discoveredDevices) {
            if (otherId !== data.serverId) {
                socket.emit('updateConfig', {
                    target: otherId,
                    config: config
                });
            }
        }

        // Sync data if not hub
        if (data.serverId !== config.hub) {
            const hubEntry = Array.from(discoveredDevices).find(([id, addr]) => id === config.hub);
            if (hubEntry) {
                const [id, addr] = hubEntry;
                const url = `http://${addr}/data`;
                http.get(url, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        fs.writeFile(path.join(__dirname, 'server/json/data.json'), body);
                    });
                }).on('error', (err) => {
                    console.error('Error syncing data from hub:', err);
                });
            }
    }
});
});