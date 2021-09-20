const Joi = require("joi");

module.exports = {

    createNew: (body) => {

        const schema = Joi.object({
            surflineNumber: Joi.string()
                .length(12)
                .regex(/233[0-9]{9}/)
                .required()
                .messages({"string.pattern.base": "MSISDN format is invalid.Must start with 233"}),
            serviceType:Joi.string()
                .valid('Default','SME','AlwaysON Group')
                .required(),
            channel: Joi.string()
                .min(3)
                .max(50)
                .lowercase()
                .required(),
            agentId: Joi.string()
                .min(3)
                .max(50)
                .lowercase()
                .required(),
            transaction_id: Joi.string()
                .min(3)
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
    getServiceTypes:(body)=>{
        const schema = Joi.object({
            surflineNumber: Joi.string()
                .length(12)
                .regex(/233[0-9]{9}/)
                .required()
                .messages({"string.pattern.base": "MSISDN format is invalid.Must start with 233"}),
            channel: Joi.string()
                .min(3)
                .max(50)
                .lowercase()
                .required(),
        });

        return schema.validate(body)


    }

}

