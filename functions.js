const prependFile = require('prepend-file')

module.exports.logger = function (file, data) {
    let fs = require("fs")
    let date = new Date()
    let content =
        date.getFullYear() + ":" +
        date.getMonth() + ":" +
        date.getDate() + "  " +
        date.getHours() + ":" +
        date.getMinutes() + ":" +
        date.getSeconds() + ":" +
        date.getMilliseconds() + " => " +
        data + "\n"

        try{
            fs.appendFileSync("logs/" + file + ".txt", content)
        } catch (e) {
            console.error(e)
            console.error("The server can't append data to " + "logs/" + file + ".txt")
        }
}