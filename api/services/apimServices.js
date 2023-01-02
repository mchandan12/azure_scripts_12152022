const httpRequestServices = require('./httpRequestServices');
const azureServices = require('./azureServices');

module.exports = {

    getAppDetailsUsingAppId: async (xid, apimToken, apimConfig, apimAppId, org, clientIdRegex, isClientSecretExpiry) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.getAppDetailsUsingAppId: Calling apim service to get application details");

        //* Get App Details
        let appDetailsResult = await httpRequestServices.request(xid, apimToken, `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/apps/${apimAppId}`, 'GET', null, 'json');
        if (appDetailsResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.getAppDetailsUsingAppId: Successfully received details of application ${apimAppId} from apim`);
            let perviousAppCredentials = appDetailsResult[1].credentials;
            let previousProducts = [];
            let previousProductsWithStatus = [];
            let isAuthorizationAdded = false;
            let previousClientId = perviousAppCredentials[0].consumerKey;
            let previousClientSecret = perviousAppCredentials[0].consumerSecret;
            let appAttributes = appDetailsResult[1].attributes;
            let newKeyAdded = false;

            const forLoop = async _ => {
                for (let credential of perviousAppCredentials) {

                    //* Check if its a client secret expiry app
                    if (isClientSecretExpiry) {

                        //* Check if new key is added
                        if (!clientIdRegex.test(credential.consumerKey)) {
                            let currentDate = new Date;
                            let keyIssuedDate = new Date(parseInt(appDetailsResult[1].createdAt));
                            
                            let issuedDateDifference = Math.floor((Date.UTC(keyIssuedDate.getFullYear(), keyIssuedDate.getMonth(), keyIssuedDate.getDate()) - Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())) / (1000 * 60 * 60 * 24));
                            if (issuedDateDifference <= 30) {
                                newKeyAdded = true;
                                previousClientId = credential.consumerKey;
                                previousClientSecret = credential.consumerSecret;
                            }
                        }
                    }

                    let apiProducts = credential.apiProducts;
                    if (apiProducts != null && apiProducts.length > 0) {
                        for (const apiProduct of apiProducts) {
                            if (apiProduct.apiproduct === "Authorization") {
                                isAuthorizationAdded = true;
                            }
                            if (!previousProducts.includes(apiProduct.apiproduct)) {
                                previousProducts.push(apiProduct.apiproduct);
                                previousProductsWithStatus.push(apiProduct);
                            }
                        }
                    }

                }
            }

            await forLoop();

            //* Add authorization if it is not added already
            if (!isAuthorizationAdded) {
                previousProducts.push('Authorization');
                previousProductsWithStatus.push({ 'apiproduct': 'Authorization', 'status': 'approved' });
            }

            let apimAppDetails = {
                "perviousAppCredentials": perviousAppCredentials,
                "previousProducts": previousProducts,
                "previousProductsWithStatus": previousProductsWithStatus,
                "previousClientId": previousClientId,
                "previousClientSecret": previousClientSecret,
                "appAttributes": appAttributes,
                "newKeyAdded": newKeyAdded
            }

            return ['SUCCESS', apimAppDetails];
        }
        else if (appDetailsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.getAppDetailsUsingAppId: ERROR: Failed to get details of application ${apimAppId} from apim. Error is ${appDetailsResult[1]}`);
            return ['ERROR', `Failed to get details of application ${apimAppId} from apim. Error is ${appDetailsResult[1]}`];
        }
    },

    addCredentials: async (xid, apimToken, apimConfig, apimAppName, org, developer, clientId, clientSecret) => {

        let postBody = {
            "consumerKey": clientId,
            "consumerSecret": clientSecret
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.addCredentials: Calling apim service to add credentials to application");

        //*Add azure credentials to APIM App
        let addCredentialsResult = await httpRequestServices.request(xid, apimToken, `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/keys/create`, 'POST', postBody, 'json');
        if (addCredentialsResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.addCredentials: Credentials has been successfully added to application ${apimAppName} of ${org} organization in apim`);
            return ['SUCCESS', `Credentials has been successfully added to application ${apimAppName} under ${org} organization in apim`];
        }
        else if (addCredentialsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.addCredentials: ERROR: Failed to add credentials to application ${apimAppName} of ${org} organization in apim. Error is ${addCredentialsResult[1]}`);
            return ['ERROR', `Failed to add credentials to application ${apimAppName} under ${org} organization in apim. Error is ${addCredentialsResult[1]}`];
        }

    },

    addApiProductsToApp: async (xid, apimToken, apimConfig, apimAppName, org, developer, clientId, apiProducts) => {

        let postBody = {
            "apiProducts": apiProducts
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.addApiProductsToApp: Calling apim service to add apiproducts to application");

        //*Add apiproducts to App
        let addApiProductsToAppResult = await httpRequestServices.request(xid, apimToken, `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/keys/${clientId}`, 'POST', postBody, 'json');
        if (addApiProductsToAppResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.addApiProductsToApp: Apiproducts has been successfully added to application ${apimAppName} of clientId ${clientId} under ${org} organization in apim`);
            return ['SUCCESS', `Apiproducts has been successfully added to application ${apimAppName} of clientId ${clientId} under ${org} organization in apim`];
        }
        else if (addApiProductsToAppResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.addApiProductsToApp: ERROR: Failed to add apiproducts to application ${apimAppName} of clientId ${clientId} under ${org} organization in apim. Error is ${addApiProductsToAppResult[1]}`);
            return ['ERROR', `Failed to add apiproducts to application ${apimAppName} of clientId ${clientId} under ${org} organization in apim. Error is ${addApiProductsToAppResult[1]}`];
        }

    },

    updateApiProductStatusOfApp: async (xid, apimToken, apimConfig, apimAppName, org, developer, clientId, apiProducts) => {

        let updatedApiProducts = [];
        let failedApiProducts = [];

        //* Update the status of all Apiproducts under application
        const forLoop = async _ => {

            for (let apiproduct of apiProducts) {

                if (apiproduct.status !== 'pending') {

                    let url;

                    sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.updateApiProductStatusOfApp: Calling apim service to update the apiproduct status of application");

                    //* Set the URL based on apiproduct status
                    if (apiproduct.status === 'approved') {
                        url = `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/keys/${clientId}/apiproducts/${apiproduct.apiproduct}?action=approve`;
                    }
                    else if (apiproduct.status === 'revoked') {
                        url = `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/keys/${clientId}/apiproducts/${apiproduct.apiproduct}?action=revoke`;
                    }

                    //*Update apiproduct status of application
                    let updateApiProductStatusOfAppResult = await httpRequestServices.request(xid, apimToken, url, 'POST', null, 'json', true);
                    if (updateApiProductStatusOfAppResult[0] === 'SUCCESS') {
                        sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.updateApiProductStatusOfApp: Apiproduct ${apiproduct.apiproduct} status has been updated to application ${apimAppName} of clientId ${clientId} under ${org} organization in apim with status ${apiproduct.status}`);
                        updatedApiProducts.push(apiproduct.apiproduct);
                    }
                    else if (updateApiProductStatusOfAppResult[0] === 'ERROR') {
                        sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.updateApiProductStatusOfApp: ERROR: Failed to update Apiproduct ${apiproduct.apiproduct} status to application ${apimAppName} of clientId ${clientId} under ${org} organization in apim with status ${apiproduct.status}. Error is ${updateApiProductStatusOfAppResult[1]}`);
                        failedApiProducts.push(apiproduct.apiproduct);
                    }
                }
                else if (apiproduct.status === 'pending') {
                    updatedApiProducts.push(apiproduct.apiproduct);
                }
            }
        }

        await forLoop();

        if (failedApiProducts.length > 0) {
            return ['ERROR', { "failedApiProducts": failedApiProducts, "updatedApiProducts": updatedApiProducts }];
        }
        else {
            return ['SUCCESS', { "updatedApiProducts": updatedApiProducts }];
        }

    },

    getAppCustomAttributes: async (xid, apimToken, apimConfig, apimAppName, org, developer) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.getAppCustomAttributes: Calling apim service to get custom attributes from application");

        //*Get custom attribute from App
        let getCustomAttributesResult = await httpRequestServices.request(xid, apimToken, `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/attributes`, 'GET', null, 'json');
        if (getCustomAttributesResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.getAppCustomAttributes: Custom attributes has been successfully received from application ${apimAppName} under ${org} organization in apim`);
            return ['SUCCESS', getCustomAttributesResult[1]];
        }
        else if (getCustomAttributesResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.getAppCustomAttributes: ERROR: Failed to get custom attributes from application ${apimAppName} under ${org} organization in apim. Error is ${getCustomAttributesResult[1]}`);
            return ['ERROR', `Failed to get custom attributes from application ${apimAppName} under ${org} organization in apim. Error is ${getCustomAttributesResult[1]}`];
        }

    },

    addCustomAttributes: async (xid, apimToken, apimConfig, apimAppName, org, developer) => {

        //* Get App Custom Attributes
        let appCustomAttributesResult = await module.exports.getAppCustomAttributes(xid, apimToken, apimConfig, apimAppName, org, developer);
        if(appCustomAttributesResult[0] === 'SUCCESS') {
            let attributes = [];

            attributes = appCustomAttributesResult[1].attribute;
            let filteredAttributes = attributes.filter(function (attribute) {
                return attribute.name;
            });
    
            filteredAttributes.push(apimConfig.azureAttribute);
    
            let postBody = {
                "attribute": filteredAttributes
            }
    
            sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.addCustomAttributesResult: Calling apim service to add custom attribute to application");
    
            //*Add custom attribute to App
            let addCustomAttributesResult = await httpRequestServices.request(xid, apimToken, `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/attributes`, 'POST', postBody, 'json');
            if (addCustomAttributesResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.addCustomAttributesResult: Custom attribute has been successfully added to application ${apimAppName} under ${org} organization in apim`);
                return ['SUCCESS', `Custom attribute has been successfully added to application ${apimAppName} under ${org} organization in apim`];
            }
            else if (addCustomAttributesResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.addCustomAttributesResult: ERROR: Failed to add custom attribute to application ${apimAppName} under ${org} organization in apim. Error is ${addCustomAttributesResult[1]}`);
                return ['ERROR', `Failed to add custom attribute to application ${apimAppName} under ${org} organization in apim. Error is ${addCustomAttributesResult[1]}`];
            }
        }
        else if(appCustomAttributesResult[0] === 'ERROR') {
            return appCustomAttributesResult;
        }

        

    },

    deleteCredentials: async (xid, apimToken, apimConfig, apimAppName, org, developer, clientId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": apimServices.deleteCredentials: Calling apim service to delete credentials of application");

        //*Delete credentials of App
        let deleteCredentialsResult = await httpRequestServices.request(xid, apimToken, `${apimConfig.apigeeManagementApiBaseUrl}/v1/organizations/${org}/developers/${developer}/apps/${apimAppName}/keys/${clientId}`, 'DELETE', null, 'json');
        if (deleteCredentialsResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.deleteCredentials: Credentials has been successfully deleted from application ${apimAppName} of ${org} organization in apim`);
            return ['SUCCESS', `Credentials has been successfully deleted from application ${apimAppName} under ${org} organization in apim`];
        }
        else if (deleteCredentialsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: apimServices.deleteCredentials: ERROR: Failed to delete credentials from application ${apimAppName} of ${org} organization in apim. Error is ${deleteCredentialsResult[1]}`);
            return ['ERROR', `Failed to delete credentials from application ${apimAppName} under ${org} organization in apim. Error is ${deleteCredentialsResult[1]}`];
        }

    },

    appUpdateWithAzureCredentials: async (xid, apimToken, apimConfig, apimAppName, org, developer, newClientId, newClientSecret, previousClientId, previousProducts, previousProductsWithStatus) => {

        //* Add credentials
        let addCredentialsResult = await module.exports.addCredentials(xid, apimToken, apimConfig, apimAppName, org, developer, newClientId, newClientSecret);
        if (addCredentialsResult[0] === 'SUCCESS') {

            //* Add API Products
            let addApiProductsToAppResult = await module.exports.addApiProductsToApp(xid, apimToken, apimConfig, apimAppName, org, developer, newClientId, previousProducts);
            if (addApiProductsToAppResult[0] === 'SUCCESS') {

                //* Update API Product Status
                let updateApiProductStatusOfAppResult = await module.exports.updateApiProductStatusOfApp(xid, apimToken, apimConfig, apimAppName, org, developer, newClientId, previousProductsWithStatus);
                if (updateApiProductStatusOfAppResult[0] === 'SUCCESS') {

                    //* Add Custom Attribute
                    let addCustomAttributeResult = await module.exports.addCustomAttributes(xid, apimToken, apimConfig, apimAppName, org, developer);
                    if (addCustomAttributeResult[0] === 'SUCCESS') {

                        //* Delete old credentials
                        let deleteOldCredentialsResult = await module.exports.deleteCredentials(xid, apimToken, apimConfig, apimAppName, org, developer, previousClientId);
                        if (deleteOldCredentialsResult[0] === 'SUCCESS') {

                            sails.log.info("XID: " + xid + " | ", new Date, `: apimServices.appUpdateWithAzureCredentials: Successfully updated azure credentials to application ${apimAppName} under ${org} organization in apim`);
                            return ['SUCCESS', `Successfully updated azure credentials to application ${apimAppName} under ${org} organization in apim`];
                        }
                        else if (deleteOldCredentialsResult[0] === 'ERROR') {
                            return deleteOldCredentialsResult;
                        }
                    }
                    else if (addCustomAttributeResult[0] === 'ERROR') {
                        return addCustomAttributeResult;
                    }
                }
                else if (updateApiProductStatusOfAppResult[0] === 'ERROR') {
                    return updateApiProductStatusOfAppResult;
                }
            }
            else if (addApiProductsToAppResult[0] === 'ERROR') {
                return addApiProductsToAppResult;
            }
        }
        else if (addCredentialsResult[0] === 'ERROR') {
            return addCredentialsResult;
        }

    }
}
