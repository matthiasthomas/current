const cassandra = require('cassandra-driver');
// It's not necessary to add all nodes to the contact points,
// As long as one nodes responds it can get information about all the nodes in the cluster
const contactPoints = process.env.APP_CASSANDRA_CONTACT_POINTS.split(',');

// Set consistency to quorum, response will be given 
// when data is written/read to/from (replicas/2)-1 nodes => maximum constistency
const client = new cassandra.Client({
    contactPoints: contactPoints,
    keyspace: 'current',
    queryOptions: { consistency: cassandra.types.consistencies.quorum }
});

const db = {
    connect: function () {
        return new Promise((resolve, reject) => {
            client.connect(function (err) {
                return err ? reject(err) : resolve(client);
            });
        });
    },
    client: client
}

module.exports = db;