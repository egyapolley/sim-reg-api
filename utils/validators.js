const Joi = require("joi");

module.exports = {

    createNew: (body) => {

        const schema = Joi.object({
            MSISDN: Joi.string()
                .length(12)
                .alphanum()
                .regex(/233[0-9]{9}/)
                .required()
                .messages({"string.pattern.base": "MSISDN format is invalid.Must start with 233"}),
            channel: Joi.string()
                .alphanum()
                .min(3)
                .max(50)
                .lowercase()
                .required(),
            transaction_id: Joi.string()
                .alphanum()
                .min(3)
                .max(50)
                .required(),
            first_name: Joi.string()
                .min(2)
                .max(255)
                .trim()
                .lowercase()
                .required(),
            last_name: Joi.string()
                .min(2)
                .max(255)
                .trim()
                .lowercase()
                .required(),
            gender: Joi.string()
                .trim()
                .lowercase()
                .required(),
            dob: Joi.string()
                .trim()
                .required(),
            address: Joi.string()
                .trim()
                .required(),
            residential_address: Joi.string()
                .trim()
                .required(),
            nationality: Joi.string()
                .trim()
                .required(),
            National_ID_type: Joi.string()
                .trim()
                .required(),
            ghana_card_number: Joi.string()
                .trim()
                .required(),
            email: Joi.string()
                .trim()
                .email()
                .required(),
            phoneContact: Joi.string()
                .trim()
                .required(),
            digital_address: Joi.string()
                .trim()
                .required(),

        });

        return schema.validate(body)


    },

}

