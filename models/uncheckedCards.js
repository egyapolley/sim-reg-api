const mongoose = require("mongoose");
const UncheckedCardsSchema = new mongoose.Schema({

    suuid: {
        type:String,
        required:true,
    },
    ghanaCard: {
        type:String,
        required:true,
    },
    lastname: {
        type:String,
        required:true,
    }


});

const UncheckedCards = mongoose.model("uncheckedcards",UncheckedCardsSchema);
module.exports = UncheckedCards;
