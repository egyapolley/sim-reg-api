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
const GhanaIDs = sequelize.define("ghanaIds", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    pinNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique:true
    },
    suuid: {
        type: Sequelize.STRING,
        allowNull:false
    },
    surname:{
        type: Sequelize.STRING,
        allowNull:false
    },
    niaData: {
        type: Sequelize.STRING,
        allowNull:false,
    }
});
const RegisteredMsisdn = sequelize.define("registeredMsisdn", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    cardNumber: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    msisdn: {
        type: Sequelize.STRING,
        allowNull: false,
        unique:true
    },

    transaction_id: {
        type: Sequelize.STRING,
        allowNull:false
    },

    staffId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    suuid: {
        type: Sequelize.STRING,
        allowNull:false
    },
    surname:{
        type: Sequelize.STRING,
        allowNull:false
    },
    customer_type: {
        type: Sequelize.STRING,
        allowNull:true
    },
    originalPayload: {
        type: Sequelize.STRING,
        allowNull:false,
    },

});
const INActivations = sequelize.define("inActivations", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    msisdn: {
        type: Sequelize.STRING,
        allowNull: false,
        unique:true
    },
    data: {
        type: Sequelize.STRING,
        allowNull:false,
    }

});




module.exports = {ServiceType,AgentMapping,GhanaIDs,RegisteredMsisdn,INActivations}
