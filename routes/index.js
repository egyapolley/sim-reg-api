const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Session = require("../models/session")
const validator = require("../utils/validators");
const passport = require("passport");
const utils = require("../utils/main_utils")
const BasicStrategy = require("passport-http").BasicStrategy;
const moment = require("moment");

const {ServiceType, AgentMapping} = require("../models/sql_models")
let agentMapping = {}
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

router.post("/register", passport.authenticate('basic', {
    session: false
}), async (req, res) => {

    let original_payload = req.body

    let {
        msisdn, first_name, last_name, transaction_id, gender, dob, channel, agent_msisdn,
        address, nationality, service_type, customer_type,
        national_Id_type, ghana_card_number, region, country,
        email, phone_contact, digital_address, city, reference
    } = req.body


    try {
        /*STEP 1 : Check Request parameters */
        const {error} = validator.createNew(req.body);
        if (error) {
            return res.status(400).json({
                Transaction_id: transaction_id,
                is_valid: false,
                SUUID: null,
                errorcode: 2,
                ResponseMessage: error.message
            })
        }
        /*STEP 2 : Check Agent msisdn map to Agent Login */
        const agent_login = await getAgentMapping(agent_msisdn)
        if (!agent_login) return res.json({
            Transaction_id: transaction_id,
            is_valid: false,
            SUUID: null,
            errorcode: 2,
            ResponseMessage: `agent_Msisdn ${agent_msisdn} not assigned to a login`
        })

        original_payload = {...original_payload, agent_login}

        /*STEP 3 : Check NEW REGISTRATION */
        if (customer_type === "NEW") {

            /*STEP 3.1 : For NEW REG,verify account not USED and number is valid */
            const isPreUse = await utils.verifyINPreUse(msisdn)
            if (!isPreUse) return res.json({
                Transaction_id: transaction_id,
                is_valid: false,
                SUUID: null,
                errorcode: 2,
                ResponseMessage: `msisdn ${msisdn} is not a valid surfline number`

            })

        } else {
            /*STEP 4 : Check EXISTING REGISTRATION */
            const data = {dob, reference, msisdn}

            /*STEP 4.1 : For EIXSTING REG, Check if account is valid and data matches in SIEBEL */
            const isValid = await utils.verifyExisting(data)
            if (!isValid) res.json({
                Transaction_id: transaction_id,
                is_valid: false,
                SUUID: null,
                errorcode: 2,
                ResponseMessage: `msisdn ${msisdn} is not a valid surfline number`
            })


        }

        /*STEP 5 : VALIDATE NIA and FETCH SUUID and KYC DATA */
        const niaResponse = await utils.niaVerify({first_name, last_name, ghana_card_number})
        if (niaResponse) {
            const {isValid, suuid, data} = niaResponse
            if (isValid) {
                /*STEP 5.1 : SAVE nia payload and original payload in a session */
                await Session.save({transaction_id,msisdn, suuid,original_payload, nia_response: data})
                return res.json({
                    Transaction_id: transaction_id,
                    is_valid: true,
                    SUUID: suuid

                })
            }
        }
        res.json({
            Transaction_id: transaction_id,
            is_valid: false,
            SUUID: null,
            errorcode: 2,
            ResponseMessage: `Card ${ghana_card_number} not valid`
        })


    } catch (ex) {
        console.log(ex)
        res.json({
            Transaction_id: transaction_id,
            is_valid: false,
            SUUID: null,
            errorcode: 1,
            ResponseMessage: `System Error`
        })


    }

})

router.post("/bio_capture", passport.authenticate('basic', {
    session: false
}), async (req, res) => {
    let {transaction_id, agent_msisdn, msisdn, biometric_data, ghana_card_number, location, suuid} = req.body

    try {
        const {error} = validator.bioCapture(req.body);
        if (error) {
            return res.status(400).json({
                Transaction_id: transaction_id,
                data_received: false,
                simcard_number: msisdn,
                responseCode: 400,
                simstatus: "not activated",
                errorcode: 2,
                ResponseMessage: error.message
            })
        }
        const session = await Session.findOne({transaction_id,msisdn,suuid})
        console.log(JSON.stringify(session))
        if (!session) return res.status(400).json({
            Transaction_id: transaction_id,
            data_received: false,
            simcard_number: msisdn,
            responseCode: 400,
            simstatus: "not activated",
            errorcode: 2,
            ResponseMessage: `${transaction_id} is not valid`

        })

        let {
            msisdn, first_name, last_name, transaction_id, gender, dob, channel,agent_msisdn,
            address, nationality, service_type, customer_type, agent_login,
            national_Id_type, ghana_card_number, region, country,
            email, phone_contact, digital_address, city, reference
        } = session.original_payload

        if (customer_type === "NEW") {
            const data = {
                msisdn,
                first_name,
                last_name,
                agent_login,
                transaction_id,
                gender,
                dob,
                address,
                nationality,
                national_Id_type,
                ghana_card_number,
                region,
                country,
                email,
                phone_contact,
                digital_address,
                city
            }

            if (process.env.SIEBEL_ONLINE === "online") {

                const {status} = await utils.registerSiebel(data)
                if (status === 1) {
                    res.json({
                        Transaction_id: transaction_id,
                        data_received: false,
                        simcard_number: msisdn,
                        responseCode: 200,
                        simstatus: "activated",
                    })
                } else res.status(500).json({
                    Transaction_id: transaction_id,
                    data_received: false,
                    simcard_number: msisdn,
                    responseCode: 500,
                    simstatus: "not activated",
                    errorcode: 1,
                    errorMessage: `System Error`
                })


            } else {
                const {status} = await utils.activateIN(data)
                if (status === 1) {
                    res.json({
                        Transaction_id: transaction_id,
                        data_received: false,
                        simcard_number: msisdn,
                        responseCode: 200,
                        simstatus: "activated",
                    })

                } else res.status(500).json({
                    Transaction_id: transaction_id,
                    data_received: false,
                    simcard_number: msisdn,
                    responseCode: 500,
                    simstatus: "not activated",
                    errorcode: 1,
                    errorMessage: `System Error`
                })

            }

            if (service_type !== "NewPrepaidOffer") {
                await utils.updateServiceClass_SIEBEL({msisdn, service_type})
            }


        } else {
            res.json({
                Transaction_id: transaction_id,
                data_received:true,
                MSISDN: msisdn,
                SMS_status:"sent"
            })

        }


    } catch (ex) {
        console.log(ex)
        res.status(500).json({
            Transaction_id: transaction_id,
            data_received: false,
            simcard_number: msisdn,
            responseCode: 500,
            simstatus: "not activated",
            errorcode: 1,
            errorMessage: `System Error`
        })

    }

})

router.get("/service_types", passport.authenticate('basic', {
    session: false
}), async (req, res) => {
    try {

        let serviceTypes = await ServiceType.findAll()
        serviceTypes = serviceTypes.map(value => {
            const {order: index, name} = value
            return {index, name}
        })
        res.json({status: 0, reason: "success", serviceTypes})

    } catch (ex) {
        console.log(ex)
        res.json({status: 1, reason: "error"})

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


async function getAgentMapping(agentMsisdn) {
    if (agentMapping[agentMsisdn]) return agentMapping[agentMsisdn]

    try {
        let tempMapping = {}
        const data = await AgentMapping.findAll()
        data.forEach((el) => {
            const {agentMsisdn, agentLogin} = el
            tempMapping[agentMsisdn] = agentLogin
        })
        agentMapping = tempMapping
        return agentMapping[agentMsisdn] ? agentMapping[agentMsisdn] : null
    } catch (ex) {
        return null
    }


}


