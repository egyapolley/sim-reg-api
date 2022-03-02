const mongoose = require("mongoose");
const SessionSchema = new mongoose.Schema({
    transaction_id: {
        type:String,
        required:true,
        unique:true,
        index:{unique:true}
    },
    msisdn: {
        type:String,
        required:true,
    },
    suuid: {
        type:String,
        required:true,
    },
    original_payload:{
        type:String,
        required:true,

    },
    nia_response:{
        type:String,
        required:true,

    },


});

const Session = mongoose.model("session",SessionSchema);
module.exports = Session;
