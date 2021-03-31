module.exports.logger = function (file, data) {
    let fs = require("fs")
    let date = new Date()
    let dateString =
        date.getFullYear() + ":" +
        date.getMonth() + ":" +
        date.getDate() + "  " +
        date.getHours() + ":" +
        date.getMinutes() + ":" +
        date.getSeconds() + ":" +
        date.getMilliseconds()

    let today = date.getFullYear() + ":" + date.getMonth() + ":" + date.getDate()

        try{
            let dir = "logs/" + today
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir)
            }
            fs.appendFileSync("logs/" + today + "/" + file + ".txt", dateString + " =>\t" + data + "\n")
            fs.appendFileSync("logs/" + today + "/ALL.txt", dateString + " =>\t" + file + "=>\t" + data + "\n")
        } catch (e) {
            console.error(e)
            console.error("The server can't append data to " + "logs/" + file + ".txt")
        }
}