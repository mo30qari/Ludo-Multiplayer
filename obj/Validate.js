const format = require("../config/request.json")
const Validate = function () {

    this.validateType = function (type) {//Every request has a __Type field that shows type of the request. This is always string...
        let result = { status: true }

        type = type.trim()

        if (!type && type === "") {
            result.error = "The __Type does not exist"
        } else if (typeof type != "string") {
            result.error = "The field must be string"
        } else if (type.length < 3) {
            result.error = "The __Type is too short"
        } else if (type.length > 32) {
            result.error = "The __Type is too long"
        }

        if (result.error) {
            result.status = false
        }

        return result
    }

    this.validateString = function (str, min, max) {
        let result = { status: true }

        let regex = /^[A-Za-z0-9]*$/
        str = str.trim()

        if (typeof str != "string") {
            result.error = "The field must be string"
        } else if (!str.match(regex)) {
            result.error = "The string structure isn't valid"
        } else if (str.length <= min) {
            result.error = "The string is too short"
        } else if (str.length >= max) {
            result.error = "The string is too long"
        }

        if (result.error) {
            result.status = false
        }

        return result
    }

    this.validateNumber = function (num, min, max) {
        let result = { status: true }

        if (typeof num != "number") {
            result.error = "The field must be number"
        } else if (num <= min) {
            result.error = "The number is too low"
        } else if (num >= max) {
            result.error = "The string is too high"
        }

        if (result.error) {
            result.status = false
        }

        return result
    }

    this.validateBool = function (bool) {
        let result = { status: true }

        if (typeof bool != "boolean") {
            result.error = "The field must be boolean"
        }

        if (result.error) {
            result.status = false
        }

        return result
    }

    this.validateObject = function (obj) {//This is a too silly method to validate an object. It should be better in the near future. 
        let result = { status: true }

        if (typeof obj != "object") {
            result.error = "The field must be object"
        }

        if (result.error) {
            result.status = false
        }

        return result
    }

    this.validateRequest = function (req) {
        let result = { status: true, errors: [] }

        let type = this.validateType(req.__Type)

        if (type.status) {//__Type is valid
            let f = format[req.__Type] //request.json
            let r //Template for saving methods returns

            for (const [key, value] of Object.entries(req)) {//Iterating in request

                if (key != "__Type") {//The __Type is already checked.

                    switch (f[key].type) {
                        case "string":
                            r = this.validateString(value, f[key].min, f[key].max)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.error)
                            }
                            break
                        case "number":
                            r = this.validateNumber(value, f[key].min, f[key].max)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.error)
                            }
                            break
                        case "bool":
                            r = this.validateBool(value)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.error)
                            }
                            break
                        case "object":
                            r = this.validateObject(value)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.error)
                            }
                            break
                        default:
                            result.errors.push("The type of field doesn't exists")
                    }

                }

            }
        } else {
            result.errors.push("__Type: " + type.error)
        }

        if (result.errors.length > 0) {
            result.status = false
        }

        return result
    }

}
exports.Validate = Validate