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
        return {result: false, error: "Invalid Type of Request!"}
    }

    this.validateRequest = function (req) {
        let result = this.validateType(req.__Type)
        if (result){        
            //Now it seems the __Type of request is correct. The rest of the message should be validated from now on.
        }
        return result.error
    }

}
exports.Validate = Validate