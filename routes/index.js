const express = require("express");
const router = express.Router();
const User = require("../models/user");
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

router.post("/register_new", passport.authenticate('basic', {
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
        console.log(req.user.channel)
        if (channel.toLowerCase() !== req.user.channel) {
            return res.json({
                status: 2,
                reason: `Invalid Request channel ${channel}`
            })
        }
        let {surflineNumber, first_name, last_name,agentId,
            transaction_id, gender, dob,
            address, nationality, serviceType,
            national_Id_type, ghana_card_number, region, country,
            email, phone_contact, digital_address, city} = req.body

        const url = "http://172.25.33.165:7777/soa-infra/services/surflinedomain/ProcessCustomerActivationWebAppReqABCSImpl/processcustomeractivationwebappreqabcsimpl_client_ep";
        const Headers = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
        };

        let soapXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
             <soapenv:Body>
                <ExecuteProcess_Input xmlns="http://webappdevelopment.org">
                   <CustomerDetails>
                      <MSISDN>${surflineNumber}</MSISDN>
                      <SIM/>
                      <Source>${agentId}</Source>
                      <UserId>MobileApp</UserId>
                      <LastName>${last_name}</LastName>
                      <FirstName>${first_name}</FirstName>
                      <MiddleName/>
                      <MM/>
                      <MF>${gender}</MF>
                      <Nationality>${nationality}</Nationality>
                      <DocVerified/>
                      <PreferredCommunications>SMS</PreferredCommunications>
                      <CellularPhone>${phone_contact}</CellularPhone>
                      <EmailAddress>${parseField(email)}</EmailAddress>
                      <AddressLine1>${address}</AddressLine1>
                      <AddressLine2/>
                      <POBox/>
                      <City>${city}</City>
                      <Region>${region}</Region>
                      <Country></Country>
                      <IDType>${national_Id_type}</IDType>
                      <IDExpirationDate/>
                      <IDInformation>${ghana_card_number}</IDInformation>
                      <Employer/>
                      <Occupation/>
                      <JobTitle>${gender}</JobTitle>
                      <BirthDate>${dob}</BirthDate>
                      <MotherMaidenName/>
                      <AccountType>Residential</AccountType>
                      <AccountSegment>Individual</AccountSegment>
                      <AccountCategory>Mid value</AccountCategory>
                      <VIP/>
                      <RequestId>${transaction_id}</RequestId>
                      <Field1/>
                      <Field2/>
                      <Field3/>
                      <Field4/>
                      <Field5/>
                   </CustomerDetails>
                </ExecuteProcess_Input>
             </soapenv:Body>
          </soapenv:Envelope>`
        const {response} = await soapRequest({url: url, headers: Headers, xml: soapXML, timeout: 5000}); // Optional timeout parameter(milliseconds)
        const {body} = response;
        let jsonObj = parser.parse(body, options);
        console.log(jsonObj.Envelope.Body.ExecuteProcess_Output)
        res.json({status: 0, reason: "success"})

    } catch (ex) {
        console.log(ex)
        res.json({status:1, reason:"error"})

    }

})

router.get("/service_types", passport.authenticate('basic', {
    session: false
}), async (req, res) => {

    try {
        const {error} = validator.getServiceTypes(req.query);
        if (error) {
            return res.json({
                status: 2,
                reason: error.message
            })
        }
        const {channel} = req.query;

        if (channel.toLowerCase() !== req.user.channel) {
            return res.json({
                status: 2,
                reason: `Invalid Request channel ${channel}`
            })
        }

        res.json({status: 0, reason: "success",serviceTypes:[
                {value:"default",label:"Default"},
                {value:"alwaysON_Group",label:"AlwaysON Group"},
                {value:"sme",label:"SME"},
        ]})

    } catch (ex) {
        console.log(ex)
        res.json({status:1, reason:"error"})

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


function parseField(field) {
    return field ? field : ""

}

