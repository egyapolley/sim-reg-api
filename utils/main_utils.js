const moment = require("moment")
const soapRequest = require("easy-soap-request");
const {XMLParser} = require('fast-xml-parser');
const {dbUpdate, dbVerify} = require("./oracledbConfig")
const oracledb = require("oracledb")

const UncheckedCards = require("../models/uncheckedCards");


const https = require("https")
const agent = new https.Agent({
    rejectUnauthorized:false
})


const axios = require("axios")


require("dotenv").config();

const libDir = process.env.ORA_LIB_DIR

try {
    console.log(libDir)
    oracledb.initOracleClient({libDir});
} catch (err) {
    console.error(err);
    process.exit(1);
}


const options = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: true,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    ignoreDeclaration: true,
    removeNSPrefix: true,
    trimValues: true,
}
const parser = new XMLParser(options)


module.exports = {

    registerSiebel: async (data) => {

        let {
            msisdn, first_name, last_name, agent_login,
            transaction_id, gender, dob,
            address, ghana_card_number, region, country,
            email, phone_contact, city
        } = data

        gender = gender === 'Male' ? 'M' : 'F'
        const url = `${process.env.SIEBEL_URL}`;
        const Headers = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
        };

        city = city.charAt(0).toUpperCase() + city.substr(1).toLowerCase()

        let soapXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
             <soapenv:Body>
                <ExecuteProcess_Input xmlns="http://webappdevelopment.org">
                   <CustomerDetails>
                      <MSISDN>${msisdn}</MSISDN>
                      <SIM/>
                      <Source>${agent_login}</Source>
                      <UserId>MobileApp</UserId>
                      <LastName>${last_name}</LastName>
                      <FirstName>${first_name}</FirstName>
                      <MiddleName/>
                      <MM/>
                      <MF>${gender}</MF>
                      <Nationality>${country}</Nationality>
                      <DocVerified/>
                      <PreferredCommunications>SMS</PreferredCommunications>
                      <CellularPhone>${phone_contact}</CellularPhone>
                      ${email ? `<EmailAddress>${email}</EmailAddress>` : `<EmailAddress></EmailAddress>`}
                      <AddressLine1>${address}</AddressLine1>
                      <AddressLine2/>
                      <POBox/>
                      <City>${city}</City>
                      <Region>${getRegion(region)}</Region>
                      <Country>${country}</Country>
                      <IDType>Ghana card</IDType>
                      <IDExpirationDate/>
                      <IDInformation>${ghana_card_number}</IDInformation>
                      <Employer/>
                      <Occupation/>
                      <JobTitle>${gender}</JobTitle>
                      <BirthDate>${moment(dob, "YYYY-MM-DD").format("MM/DD/YYYY")}</BirthDate>
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
        console.log(soapXML)
        try {
            const {response} = await soapRequest({url: url, headers: Headers, xml: soapXML, timeout: 10000}); // Optional timeout parameter(milliseconds)
            const {body} = response;
            let jsonObj = parser.parse(body);
            const ResponseBody = jsonObj.Envelope.Body.ExecuteProcess_Output
            console.log(JSON.stringify(ResponseBody))
            return !!(ResponseBody && ResponseBody.CustomerDetails && ResponseBody.CustomerDetails.ErrorMessage === 'Accepted');


        } catch (ex) {
            console.log(ex)
            return false


        }


    },
    activateIN: async (data) => {

        let {msisdn, email, phone_contact} = data


        const url = process.env.IN_OSD
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/VoucherRecharge_USSD/VoucherRecharge_USSD',
            'Authorization': `${process.env.OSD_AUTH}`
        };


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sim="http://SCLINSMSVM01P/wsdls/Surfline/SIM_REG_IN_ACTIVATION.wsdl">
<soapenv:Header/>
   <soapenv:Body>
      <sim:SIM_REG_IN_ACTIVATIONRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
         <VOUCHER_SERIAL>${phone_contact}</VOUCHER_SERIAL>
         <VOUCHER_TYPE>SMS</VOUCHER_TYPE>
         <TRANSACTION_ID>${email}</TRANSACTION_ID>
         <WALLET_TYPE>Primary</WALLET_TYPE>
      </sim:SIM_REG_IN_ACTIVATIONRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 10000}); // Optional timeout parameter(milliseconds)

            const {body} = response;

            let jsonObj = parser.parse(body, options);
            let result = jsonObj.Envelope.Body;
            return (result.SIM_REG_IN_ACTIVATIONResult === "")
        } catch (ex) {
            console.log(ex)
            return false
        }


    },
    verifyExisting: async (data) => {
        const {dob, reference: contact, msisdn} = data


        let connection = null;
        try {
            connection = await oracledb.getConnection(dbVerify)
            const sql = `SELECT * FROM SIEBEL.SEARCHSIM2 where msisdn =:msisdn`
            const binds = {msisdn}
            const options = {outFormat: oracledb.OUT_FORMAT_OBJECT}
            const {rows} = await connection.execute(sql, binds, options)
            console.log(JSON.stringify(rows), JSON.stringify(rows[0]))
            //return rows.length > 0 && (rows[0].CELLPHONENUMBER === contact) && (moment(dob, "YYYY-MM-DD").isSame(moment((rows[0].DOB).toString())))
            //return rows.length > 0  && (moment(dob, "YYYY-MM-DD").isSame(moment((rows[0].DOB).toString())))
            return rows.length > 0 && (moment(new Date(dob)).isSame(moment((rows[0].DOB))))

        } catch (ex) {
            console.log(ex)
            return false

        } finally {
            if (connection) {
                try {
                    await connection.close()
                } catch (ex) {
                    console.log(ex)
                }
            }

        }

    },
    updateServiceClass_SIEBEL: async (data) => {
        const {msisdn, service_type} = data
        let connection = null;
        try {
            connection = await oracledb.getConnection(dbUpdate)
            const sql = `UPDATE  siebel.S_INV_PROF@crm_to_bi   set X_SL_OFFER = :serviceType, last_upd=  sysdate  where row_id in (select  a.row_id  from  siebel.S_INV_PROF@crm_to_bi  a, siebel.s_asset@crm_to_bi  b where  b.serial_num =:msisdn and  b.owner_accnt_id  =  a.accnt_id)`
            const binds = {service_type, msisdn}
            const options = {outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true}
            const result = await connection.execute(sql, binds, options)
            console.log(JSON.stringify(result))
            return true
        } catch (ex) {
            console.log(ex)
            return false

        } finally {
            if (connection) {
                try {
                    await connection.close()
                } catch (ex) {
                    console.log(ex)
                }
            }

        }

    },
    updateServiceClass_IN: async (data) => {
        const {msisdn, service_type} = data

        try {
            const soapUrl = process.env.PI_HOST;
            const soapHeaders = {
                'User-Agent': 'NodeApp',
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'urn:CCSCD1_QRY',
            };
            let xmlBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>${process.env.PI_USER}</pi:username>
         <pi:password>${process.env.PI_PASS}</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:PRODUCT>${service_type}</pi:PRODUCT>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

            const {response} = await soapRequest({
                url: soapUrl,
                headers: soapHeaders,
                xml: xmlBody,
                timeout: 8000
            });
            const {body} = response;
            let jsonObj = parser.parse(body);
            const output = jsonObj.Envelope.Body
            console.log(JSON.stringify(output))
            return (output.CCSCD1_CHGResponse && output.CCSCD1_CHGResponse.AUTH)
        } catch (error) {
            console.log(error);
            return false

        }


    },
    verifyINPreUse: async (msisdn) => {
        try {
            const soapUrl = process.env.PI_HOST;
            const soapHeaders = {
                'User-Agent': 'NodeApp',
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'urn:CCSCD1_QRY',
            };
            let xmlBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_QRY>
         <pi:username>${process.env.PI_USER}</pi:username>
         <pi:password>${process.env.PI_PASS}</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:LIST_TYPE>STATUS</pi:LIST_TYPE>
      </pi:CCSCD1_QRY>
   </soapenv:Body>
</soapenv:Envelope>`;

            const {response} = await soapRequest({
                url: soapUrl,
                headers: soapHeaders,
                xml: xmlBody,
                timeout: 8000
            });
            const {body} = response;
            let jsonObj = parser.parse(body);
            const output = jsonObj.Envelope.Body
            return output.CCSCD1_QRYResponse && output.CCSCD1_QRYResponse.STATUS === 'P'
        } catch (error) {
            console.log(error);
            return false

        }


    },
    niaVerify: async (lastname, ghanaCard) => {


        const body = {
            "deviceInfo": {"deviceId": "inserver", "deviceType": "DESKTOP", "notificationToken": null},
            "username": `${process.env.NIA_USERNAME}`,
            "password": `${process.env.NIA_PASSWORD}`
        }

        const authURL = `${process.env.NIA_AUTH_URL}`
        const dataURL = `${process.env.NIA_DATA_URL}`

        try {

            let authResult = null

            try {
                const {data: authResponse} = await axios.post(authURL, body,{httpsAgent:agent})
                authResult = authResponse
            } catch (authEx) {
                console.log(authEx)
                // let suuid = getSuid()
                // let unchecked = new UncheckedCards({suuid, ghanaCard, lastname})
                // await unchecked.save()
                // return {suuid, data: {ghanaCard, lastname, suuid}}
                return null
            }

            const {success, code} = authResult
            if (success && code === '00') {
                const {accessToken} = authResult.data
                if (accessToken) {

                    const headers = {
                        Authorization: `Bearer ${accessToken}`
                    }

                    const dataBody = {
                        pinNumber: ghanaCard,
                        surname: lastname
                    }

                    const {data: dataResponse} = await axios.post(dataURL, dataBody, {headers, httpsAgent:agent})
                    const {success, code, data} = dataResponse
                    if (success && code === '00' && data.shortGuid) {
                        return {suuid: data.shortGuid, data}
                    }

                }
            }
            return null;
        } catch (ex) {
            console.log(ex)
            if (ex.response && ex.response.data) {
                console.log("#".repeat(50))
                console.log(JSON.stringify(ex.response.data))
                console.log("#".repeat(50))
            }
            return null
        }
    },

    pushSMS: async function pushSMS(smsContent, to_msisdn) {

        const {SMS_URL, SMS_AUTH} = process.env


        let messageBody = {
            Content: smsContent,
            FlashMessage: false,
            From: "Surfline",
            To: to_msisdn,
            Type: 0,
            RegisteredDelivery: true
        };

        return axios.post(SMS_URL, messageBody, {headers: {Authorization: SMS_AUTH}})


    },
    rewardCustomer: async (msisdn) => {
        const url = process.env.IN_OSD
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/VoucherRecharge_USSD/VoucherRecharge_USSD',
            'Authorization': `${process.env.OSD_AUTH}`
        };


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sim="http://SCLINSMSVM01P/wsdls/Surfline/SIM_REG_1GB_REWARD.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <sim:SIM_REG_1GB_REWARDRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
      </sim:SIM_REG_1GB_REWARDRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 10000}); // Optional timeout parameter(milliseconds)
            const {body} = response;
            let jsonObj = parser.parse(body, options);
            let result = jsonObj.Envelope.Body;
            return (result.SIM_REG_1GB_REWARDResult === "")
        } catch (ex) {
            console.log(ex)
            return false
        }


    },


}


function getRegion(region) {
    region = region.toString().toLowerCase();
    if (region.includes("accra")) return 'Gt. Accra'
    else if (region.includes("western")) return 'Western'
    else if (region.includes("ashanti")) return 'Ashanti'
    else if (region.includes("eastern")) return 'Eastern'
    else if (region.includes("central")) return 'Central'
    else if (region.includes("volta")) return 'Volta'
    else if (region.includes("brong")) return 'BrongAhafo'
    else if (region.includes("northern")) return 'Northern'
    else if (region.includes("upper east")) return 'Upper East'
    else if (region.includes("upper west")) return 'Upper West'
    else return 'Gt. Accra'
}

function getSuid() {

    let s = "01234566789ABCDEFGHIJKLMNPQRSUVWXYZ"

    let result = ""

    for (let i = 0; i < 9; i++) {

        let c = s.charAt(Math.floor(Math.random() * s.length))
        result += c

    }
    return result

}


