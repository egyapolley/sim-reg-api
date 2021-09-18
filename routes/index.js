const express = require("express");
const router = express.Router();
const User = require("../model/user");
const validator = require("../utils/validators");
const passport = require("passport");
const utils = require("../utils/main_utils")
const BasicStrategy = require("passport-http").BasicStrategy;
const moment = require("moment");


const soapRequest = require("easy-soap-request");
const parser = require('fast-xml-parser');
const he = require('he');
const options = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: true,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    arrayMode: false,
    attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),
    tagValueProcessor: (val, tagName) => he.decode(val),
    stopNodes: ["parse-me-as-string"]
};

passport.use(new BasicStrategy(
    function (username, password, done) {
        User.findOne({username: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            user.comparePassword(password, function (error, isMatch) {
                if (err) return done(error);
                else if (isMatch) {
                    return done(null, user)
                } else {
                    return done(null, false);
                }

            })

        });
    }
));


router.post("/create_new", passport.authenticate('basic', {
    session: false
}), async (req, res) => {

    try {

        const {error} = validator.createNew(req.body);
        if (error) {
            return res.json({
                status: 2,
                reason: error.message
            })
        }
        const {channel} = req.body;
        if (channel.toLowerCase() !== req.user.channel) {
            return res.json({
                status: 2,
                reason: `Invalid Request channel ${channel}`
            })

        }
    }catch (ex){

    }





})



router.post("/user", async (req, res) => {
    try {
        let {username, password, channel} = req.body;
        let user = new User({
            username,
            password,
            channel,
        });
        user = await user.save();
        res.json(user);

    } catch (error) {
        res.json({error: error.toString()})
    }


});


module.exports = router;

