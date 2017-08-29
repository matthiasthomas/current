const transactionSchema = require('./transaction.model');
const _ = require('lodash');
const uuidv4 = require('uuid/v4');

const db = require('../../config/db.conf');

const Ajv = require('ajv');
const ajv = new Ajv({ coerceTypes: true });
const validateTransaction = ajv.compile(transactionSchema);

const transactionDAO = {};

transactionDAO.createNew = (transaction, extension) => {
    return new Promise((resolve, reject) => {
        if (!_.isObject(transaction)) {
            return reject({
                status: 400,
                message: 'Transaction is not a valid object.'
            });
        }

        transaction.id = uuidv4();
        const valid = validateTransaction(transaction);
        if (!valid) {
            // Implement real logger for real life app
            console.log(validateTransaction.errors);
            return reject({
                status: 400,
                message: 'Missing field in transaction object.'
            });
        }

        const query = `INSERT INTO trx 
            (id, sym, action, amt, cuid0, cuid1, actor, source, 
            destination, note, tuid, external_id, 
            timestamp, ref_tuid) 
            VALUES 
            (:id, :sym, :action, :amt, :cuid0, :cuid1, :actor, :source, 
            :destination, :note, :tuid, :external_id, 
            :timestamp, :ref_tuid)`;
        // Parameters by marker name
        db.client.execute(query, transaction, { prepare: true })
            .then(result => {
                // Cassandra doesn't read before executing a write 
                // So two inserts on the same primary key will actually update the row
                // And return a success
                console.log(result);
                delete transaction.id;
                return resolve({
                    status: 201,
                    message: transaction
                });
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByTuid = (tuid) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM trx WHERE tuid=?`;
        db.client.execute(query, [tuid], { prepare: true })
            .then(result => {
                return resolve({
                    status: 200,
                    message: result.rows
                })
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByRefTuid = (tuid) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM trx WHERE ref_tuid=?`;
        db.client.execute(query, [tuid], { prepare: true })
            .then(result => {
                return resolve({
                    status: 200,
                    message: result.rows
                })
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByTuidOrRefTuid = (tuid) => {
    return new Promise((resolve, reject) => {
        Promise.all([
            transactionDAO.getByTuid(tuid),
            transactionDAO.getByRefTuid(tuid)
        ]).then((val_array) => {
            let result = val_array[0].message.concat(val_array[1].message);
            result = removeDuplicatesBy(result, 'id');
            // Remove id key
            result.map(r => {
                delete r.id;
                return r;
            });
            // Sort by timestamp asc
            result.sort((a, b) => {
                return parseInt(a.timestamp - parseInt(b.timestamp));
            });
            return resolve({
                status: 200,
                message: result
            });
        }).catch(err => {
            return reject({
                status: 500,
                message: err
            });
        });
    });
}

function removeDuplicatesBy(originalArray, objKey) {
    var trimmedArray = [];
    var values = [];
    var value;
    for (var i = 0; i < originalArray.length; i++) {
        value = originalArray[i][objKey];
        if (values.indexOf(value) === -1) {
            trimmedArray.push(originalArray[i]);
            values.push(value);
        }
    }
    return trimmedArray;
}

transactionDAO.getBySource = (wuid) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM trx WHERE source=?`;
        db.client.execute(query, [wuid], { prepare: true })
            .then(result => {
                return resolve({
                    status: 200,
                    message: result.rows
                })
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByDestination = (wuid) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM trx WHERE destination=?`;
        db.client.execute(query, [wuid], { prepare: true })
            .then(result => {
                return resolve({
                    status: 200,
                    message: result.rows
                })
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByWuid = (wuid) => {
    return new Promise((resolve, reject) => {
        Promise.all([
            transactionDAO.getBySource(wuid),
            transactionDAO.getByDestination(wuid)
        ]).then(val_array => {
            let result = val_array[0].message.concat(val_array[1].message);
            result = removeDuplicatesBy(result, 'id');
            // Remove id key
            result.map(el => { delete el.id; return el; });
            // Sort by asc timestamp first
            result.sort((a, b) => {
                return parseInt(a.timestamp - parseInt(b.timestamp));
            });
            // group by tuid
            result = groupBy(result, function (item) {
                return [item.tuid];
            });
            // sort by desc timestamp of first el of table
            result.sort((a, b) => {
                return parseInt(b[0].timestamp - parseInt(a[0].timestamp));
            });
            return resolve({
                status: 200,
                message: result
            });
        }).catch(err => {
            return reject({
                status: 500,
                message: err
            });
        });
    });
}

function groupBy(array, f) {
    var groups = {};
    array.forEach(function (o) {
        var group = JSON.stringify(f(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
        return groups[group];
    })
}

module.exports = transactionDAO;