import fs from "fs"

function log(message) {
    // console.log(message)

    // log to a file
    fs.appendFileSync("log.txt", `${message}\n`)
}

export default log