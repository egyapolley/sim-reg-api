const moment = require("moment")
const soapRequest = require("easy-soap-request");
const {XMLParser} = require('fast-xml-parser');
const {dbUpdate, dbVerify} = require("./oracledbConfig")
const oracledb = require("oracledb")

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
            address,
            national_Id_type, ghana_card_number, region, country,
            email, phone_contact, digital_address, city
        } = data

        gender = gender === 'male' ? 'M' : 'F'
        const url = `${process.env.SIEBEL_URL}`;
        const Headers = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
        };

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
                      <Region>${region}</Region>
                      <Country>${country}</Country>
                      <IDType>${national_Id_type}</IDType>
                      <IDExpirationDate/>
                      <IDInformation>${ghana_card_number}</IDInformation>
                      <Employer/>
                      <Occupation/>
                      <JobTitle>${gender}</JobTitle>
                      <BirthDate>${moment(dob, "DD/MM/YYYY").format("MM/DD/YYYY")}</BirthDate>
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

        let {
            surflineNumber, first_name, last_name, agentId,
            transaction_id, gender, dob,
            address, nationality, serviceType,
            national_Id_type, ghana_card_number, region, country,
            email, phone_contact, digital_address, city
        } = data

        gender = gender === 'male' ? 'M' : 'F'
        const url = `${process.env.SIEBEL_URL}`;
        const Headers = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
        };

        let soapXML = ``
        try {
            const {response} = await soapRequest({url: url, headers: Headers, xml: soapXML, timeout: 10000}); // Optional timeout parameter(milliseconds)
            const {body} = response;
            let jsonObj = parser.parse(body);
            if (jsonObj.Envelope.Body.ExecuteProcess_Output) {
                const output = jsonObj.Envelope.Body.ExecuteProcess_Output
                console.log(output)

            }
            return {status: 0, reason: "success"}


        } catch (ex) {
            console.log(ex)
            return {status: 1, reason: "system error"}


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
            console.log(rows)
            return rows.length > 0 && (rows[0].CELLPHONENUMBER === contact) && (moment(dob, "DD/MM/YYYY").isSame(moment((rows[0].DOB).toString())))

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
        const {msisdn, serviceType} = data
        let connection = null;
        try {
            connection = await oracledb.getConnection(dbUpdate)
            const sql = `UPDATE  siebel.S_INV_PROF@crm_to_bi   set X_SL_OFFER = :serviceType, last_upd=  sysdate  where row_id in (select  a.row_id  from  siebel.S_INV_PROF@crm_to_bi  a, siebel.s_asset@crm_to_bi  b where  b.serial_num =:msisdn and  b.owner_accnt_id  =  a.accnt_id)`
            const binds = {serviceType, msisdn}
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

        const {data: authResponse} = await axios.post(authURL, body)
        console.log(JSON.stringify(authResponse))

        const {success, code} = authResponse
        if (success && code === '00') {
            const {accessToken} = authResponse.data;
            if (accessToken) {

                const headers = {
                    Authorization: `Bearer ${accessToken}`
                }

                const dataBody = {
                    pinNumber: ghanaCard,
                    surname: lastname
                }

                const {data: dataResponse} = await axios.post(dataURL, dataBody, {headers})
                console.log(JSON.stringify(dataResponse))

                const {success, code, data} = dataResponse
                if (success && code === '00' && data.shortGuid) {
                    return {suuid: data.shortGuid, data}
                }

            }
        }


        return null;
    }


}
