const logger = function (file, data) {
    let fs = require("fs")
    let date = new Date()
    let content = date.getMonth() + ":" +
        date.getDate() + "  " +
        date.getHours() + ":" +
        date.getMinutes() + ":" +
        date.getSeconds() + ":" +
        date.getMilliseconds() + " => " +
        data + "\n"

    fs.open("logs/" + file + ".txt", "w", function (err) {
        if (err) {
            console.log(err)
            return
        }
        fs.appendFile("logs/" + file + ".txt", content)
    })
}

exports = {
    "logger": logger
}