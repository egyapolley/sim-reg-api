const Joi = require("joi");

module.exports = {

    register: (body) => {

        const schema = Joi.object({
            msisdn: Joi.string()
                .length(12)
                .regex(/233[0-9]{9}/)
                .required()
                .messages({"string.pattern.base": "MSISDN format is invalid.Must start with 233"}),
            service_type: Joi.string()
                .required(),
            customer_type: Joi.string()
                .valid('NEW', 'EXISTING')
                .required(),
            transaction_id: Joi.string()
                .min(3)
                .required(),
            first_name: Joi.string()
                .min(2)
                .max(255)
                .trim()
                .uppercase()
                .required(),
            country: Joi.string()
                .min(2)
                .max(255)
                .trim()
                .required(),
            last_name: Joi.string()
                .min(2)
                .max(255)
                .trim()
                .uppercase()
                .required(),
            gender: Joi.string()
                .trim()
                .lowercase()
                .required(),
            dob: Joi.string()
                .trim()
                .required(),
            agent_msisdn: Joi.string()
                .trim()
                .required(),
            address: Joi.string()
                .trim()
                .required(),
            residential_address: Joi.string()
                .trim(),
            agent_Msisdn: Joi.string()
                .trim(),
            region: Joi.string()
                .trim()
                .required(),
            city: Joi.string()
                .trim()
                .required(),
            nationality: Joi.string()
                .trim()
                .required(),
            national_Id_type: Joi.string()
                .trim()
                .required(),
            ghana_card_number: Joi.string()
                .trim()
                .required(),
            email: Joi.string()
                .trim()
                .email(),
            reference: Joi.string()
                .trim(),
            phone_contact: Joi.string()
                .length(12)
                .regex(/233[0-9]{9}/)
                .required()
                .messages({"string.pattern.base": "MSISDN format is invalid.Must start with 233"}),
            digital_address: Joi.string()
                .trim()
        });

        return schema.validate(body)


    },

    bioCapture: (body) => {

        const schema = Joi.object({
            transaction_id: Joi.string()
                .required()
                .trim(),
            msisdn: Joi.string()
                .required(),
            agent_msisdn: Joi.string()
                .required(),
            biometric_data: Joi.string()
                .required(),
            suuid: Joi.string()
                .required(),
            ghana_card_number: Joi.string()
                .required(),
            location: Joi.object({
                lat: Joi.string(),
                lng: Joi.string(),
            })

        });

        return schema.validate(body)


    },

}

