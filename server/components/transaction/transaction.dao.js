const transactionSchema = require('./transaction.model');
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

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
           // console.log(validateTransaction.errors);
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
              //  console.log(result);
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

transactionDAO.getBy = (property, value) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM trx WHERE ' + property + '=?';
        db.client.execute(query, [value], { prepare: true })
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

transactionDAO.getByTuid = (tuid) => {
    return new Promise((resolve, reject) => {
        Promise.all([
            transactionDAO.getBy('tuid', tuid),
            transactionDAO.getBy('ref_tuid', tuid)
        ]).then((val_array) => {
            let result = prepareDataFromArrays(val_array);
            // Sort by timestamp asc
            result.sort((a, b) => {
                return a.timestamp - b.timestamp;
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

transactionDAO.getByWuid = (wuid) => {
    return new Promise((resolve, reject) => {
        Promise.all([
            transactionDAO.getBy('source', wuid),
            transactionDAO.getBy('destination', wuid)
        ]).then(val_array => {
            let result = prepareDataFromArrays(val_array);
            // Sort by asc timestamp first
            result.sort((a, b) => {
                return a.timestamp - b.timestamp;
            });
            // group by tuid
            result = groupBy(result, function (item) {
                return [item.tuid];
            });
            // sort by desc timestamp of first el of table
            result.sort((a, b) => {
                return b[0].timestamp - a[0].timestamp;
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

prepareDataFromArrays = (arrays) => {
    // concatenate arrays and remove duplicates in one pass
    let result = [];
    let check_set = new Set();
    for (let i = 0; i < arrays.length; i++) {
        for (let j = 0; j < arrays[i].message.length; j++) {
            if (!check_set.has(arrays[i].message[j].id.toString())) {
                // Format the data
                arrays[i].message[j].amt = +arrays[i].message[j].amt;
                arrays[i].message[j].timestamp = +arrays[i].message[j].timestamp;
                // add key to set
                check_set.add(arrays[i].message[j].id.toString());
                // remove id key
                delete arrays[i].message[j].id;
                // Add the data to our array
                result.push(arrays[i].message[j]);
            }
        }
    }
    return result;
}

groupBy = (array, f) => {
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