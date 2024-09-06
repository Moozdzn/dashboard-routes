// @ts-check

const fs = require("node:fs")
const path = require("node:path")

module.exports = () =>{

    const tempPath = path.join(process.cwd(), "temp");
    if (fs.existsSync(tempPath)) {

        for (const file of fs.readdirSync(tempPath)) {
            if (path.extname(file) === ".csv") {
                fs.unlinkSync(path.join(tempPath, file));
            }
        }
    }

    return {};
};