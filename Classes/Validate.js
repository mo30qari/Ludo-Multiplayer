const Validate = function () {

    this.validateString = function (str, min, max) {

        let regex = /^[A-Za-z0-9]*$/
        if (str.match(regex) && str.length >= min && str.length <= max) {
            return true
        } else {
            return false
        }
    }
}

exports.Validate = Validate