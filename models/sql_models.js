const Sequelize = require("sequelize");

const sequelize = require("../utils/sql_database");


/*const Logs = sequelize.define("logs", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },

    transactionId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    channel: {
        type: Sequelize.STRING,
        allowNull: false,

    },
    surflineNumber: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    requestType: {
        type: Sequelize.STRING,
        allowNull: false,

    },
    requestBody: {
        type: Sequelize.STRING,
    },
    responseBody: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    },

});*/

const ServiceType = sequelize.define("serviceType", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    order: {
        type: Sequelize.INTEGER,
        allowNull:false
    },
});
const AgentMapping = sequelize.define("agentMapping", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    agentMsisdn: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    agentLogin: {
        type: Sequelize.STRING,
        allowNull:false
    },
});



module.exports = {ServiceType,AgentMapping}
