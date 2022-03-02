require("dotenv").config();
module.exports = {

    dbVerify: {
        user: process.env.ORADB_USER1,
        password: process.env.ORADB_PASS1,
        connectString: process.env.ORADB_CONNECT1
    },
    dbUpdate: {
        user: process.env.ORADB_User2,
        password: process.env.ORADB_PASS2,
        connectString: process.env.ORADB_CONNECT2
    }

}
