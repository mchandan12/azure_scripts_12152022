const axios = require('axios');
const requestPromise = require('request-promise');

module.exports = {

    //*Generic HTTP Request which supports all methods
    request: async (xid, token, url, method, body, responseFormat, isOctetStream = false) => {

        //*Check if URL is null
        if (url == null) {
            return ["ERROR", `URL is null. Please provide valid URL`];
        }

        //*Check if Method is null
        if (method == null) {
            return ["ERROR", `Method is null. Please provide valid Method`];
        }

        //*Check for Token is null
        if (token == null) {
            return ["ERROR", `Token is null. Please provide valid Token`];
        }

        //*Check for responseFormat is null
        if (responseFormat == null) {
            return ["ERROR", `Response Format is null. Please provide valid Response Format`];
        }

        //*HTTP Request Details
        let options = {
            uri: `${url}`,
            headers: {
                'Authorization': 'Bearer ' + token
            },
            method: `${method}`,
            strictSSL: false

        };

        //*Add Response Format
        if (responseFormat === 'json') {
            options.json = true;

            //* Check if content type is octetStream
            if (isOctetStream) {
                options.headers['Content-Type'] = 'application/octet-stream';
            }
            else {
                options.headers['Content-Type'] = 'application/json';
            }

        }

        //*Add Body for POST and PATCH Request
        if ((method === 'POST' || method === 'PATCH') && body != null) {
            options.body = body;
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": httpRequestServices.request: Configured Request Details: " + options.uri);

        //*Calling HTTP Request
        result = await requestPromise(options)
            .then(function (response) {
                return ["SUCCESS", response];
            })
            .catch(function (error) {
                return ["ERROR", error];

            });

        return result;
    },

    testRequest: async (url, baseUrl, method, responseFormat) => {


        try {
            const response = await axios({
                method: 'get',
                url: `${baseUrl}${url}`,
                responseType: 'json',
                withCredentials: true
            })
            return response;
        }
        catch (error) {
            return error
        }


    }
}
