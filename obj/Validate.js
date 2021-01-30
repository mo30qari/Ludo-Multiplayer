const format = require("../config/request.json")
const Validate = function () {

    this.validateString = function (str, min, max) {
        let regex = /^[A-Za-z0-9]*$/
        if (str.match(regex) && str.length >= min && str.length <= max) {
            return true
        } else {
            return false
        }
    }
    
    this.validateType = function(type){
        type = type.trim()
        
        if(type && type != "" && typeof type === "string" && type.length > 0 && type.length < 32){
            return {result: true}
        }
        return {result: false, error: "Invalid type of request!"}
    }

    this.validateRequest = function (req) {
        let result = this.validateType(req.__Type)
        if (result){//__Type is valid    
            let f = format[req.__Type]

            for(const[key, value] of Object.entries(req)){//Iterating in request
                if(key != "__Type"){//__Type has been validated before, Validate everything but that.
                    switch (key){
                        case "string":
                            this.validateString()
                    }
                }
            }
        }
        return result.error
    }

}
exports.Validate = Validate