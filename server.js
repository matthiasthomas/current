// requires
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const router = express.Router();
const helmet = require('helmet');
require('dotenv-extended').load();

const app = express();

//Connect to cassandra
const db = require('./server/config/db.conf');
let cassandra_client;
db.connect().then(client => {
    cassandra_client = client;
    // parsers
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    // Security
    app.use(helmet());

    const routes = require('./server/index.routes');
    app.use('/api', routes.router);

    /**
     * Get port from environment and store in Express.
     */
    const port = process.env.PORT || '3000';
    app.set('port', port);

    /**
     * Create HTTP server.
     */
    const server = http.createServer(app);

    /**
     * Listen on provided port, on all network interfaces.
     */
    server.listen(port, () => console.log(`API running on localhost:${port}`));
}).catch(err => {
    console.log(err);
    process.exit(1);
});