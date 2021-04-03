module.exports.logger = function (account, data) {
    let fs = require("fs")
    let d = new Date()
    let date = convertDate(d, "Asia/Tehran")
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
            // let dir = "logs/" + today
            // if (!fs.existsSync(dir)){
            //     fs.mkdirSync(dir)
            // }
            // fs.appendFileSync("logs/" + today + "/" + file + ".txt", dateString + " =>\t" + data + "\n")
            fs.appendFileSync("logs/" + today + ".txt", dateString + " =>\t" + account + "=>\t" + data + "\n")
        } catch (e) {
            console.error(e)
            console.error("The server can't append data to " + "logs/" + account + ".txt")
        }
}

/**
 * This function change Timezone for Date object.
 * @param date
 * @param tzString
 * @returns {Date}
 */
let convertDate = function (date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));
}