const express = require("express");
const router = require("./routes/index");
const mongoose = require("mongoose");
const helmet = require("helmet");

const sequelize = require("./utils/sql_database");
const {Logs} = require("./models/sql_models");


require("dotenv").config();

mongoose.connect("mongodb://localhost/sim_reg", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB connected")
    sequelize.sync({

    })
        .then(() => {
            console.log("Sequelize connected")

            const app = express();
            app.use(helmet());
            app.use(express.json());
            app.use(express.urlencoded({extended: false}));

            let PORT = process.env.PORT;
            let HOST = process.env.HOST;

            app.use(router);

            app.listen(PORT, () => {
                console.log(`Server running  on url : http://${HOST}:${PORT}`)
            })

        })
        .catch((error) => {
            console.log("Cannot connect to MySQL");
            throw error;

        })


}).catch(err => {
    console.log("Cannot connect to MongoDB");
    throw err;
});
