const format = require("../config/request.json")
const Validate = function () {

    this.validateType = function (type) {//Every request has a __Type property that shows type of the request. This is always string...
        let result = { status: true, errors: [] }

        type = type.trim()

        if (!type && type === "") {
            result.error = "The __Type does not exist"
        } else if (typeof type != "string") {
            result.errors.push("The property must be string")
        } else if (type.length < 3) {
            result.errors.push("The __Type is too short")
        } else if (type.length > 32) {
            result.errors.push("The __Type is too long")
        }

        if (result.errors.length) {
            result.status = false
        }

        return result
    }

    this.validateString = function (str, min, max) {
        let result = { status: true, errors: [] }

        let regex = /^[A-Za-z0-9]*$/
        str = str.trim()

        if (typeof str != "string") {
            result.errors.push("The property must be string")
        } else if (!str.match(regex)) {
            result.errors.push("The string structure isn't valid")
        } else if (str.length < min) {
            result.errors.push("The string is too short")
        } else if (str.length > max) {
            result.errors.push("The string is too long")
        }

        if (result.errors.length) {
            result.status = false
        }

        return result
    }

    this.validateNumber = function (num, min, max) {
        let result = { status: true, errors: [] }

        if (typeof num != "number") {
            result.errors.push("The property must be number")
        } else if (num < min) {
            result.errors.push("The number is too low")
        } else if (num > max) {
            result.errors.push("The number is too high")
        }

        if (result.errors.length) {
            result.status = false
        }

        return result
    }

    this.validateBool = function (bool) {
        let result = { status: true, errors: [] }

        if (typeof bool != "boolean") {
            result.errors.push("The property must be boolean")
        }

        if (result.errors.length) {
            result.status = false
        }

        return result
    }

    this.validateObject = function (obj, props) {//This is a too silly method to validate an object. It should be better in the near future. 
        let result = { status: true, errors: [] }

        if (typeof obj != "object") {
            result.errors.push("The property must be object")
        } else {
            props.forEach(function (key) {
                if (!obj.hasOwnProperty(key)) {
                    result.errors.push(key + ": " + "doesn't exists in property")
                }
            })
        }

        if (result.errors.length) {
            result.status = false
        }

        return result
    }

    this.validateRequest = function (req) {
        let result = { status: true, errors: [] }

        let type = this.validateType(req.__Type)

        if (type.status) {//__Type is valid
            let structure = format[req.__Type] //request.json
            let r //Template for saving methods returns

            for (const [key, value] of Object.entries(req)) {//Iterating in request

                if (key != "__Type") {//The __Type is already checked.

                    switch (structure[key].type) {
                        case "string":
                            r = this.validateString(value, structure[key].min, structure[key].max)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.errors)
                            }
                            break
                        case "number":
                            r = this.validateNumber(value, structure[key].min, structure[key].max)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.errors)
                            }
                            break
                        case "bool":
                            r = this.validateBool(value)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.errors)
                            }
                            break
                        case "object":
                            r = this.validateObject(value, structure[key].properties)
                            if (!r.status) {
                                result.errors.push(key + ": " + r.errors)
                            }
                            break
                        default:
                            result.errors.push("The type of property doesn't exist!")
                    }

                }

            }
        } else {
            result.errors.push("__Type: " + type.errors)
        }

        if (result.errors.length > 0) {
            result.status = false
        }

        return result
    }

}
exports.Validate = Validate