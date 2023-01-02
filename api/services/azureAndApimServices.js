const emailServices = require('./EmailServices');
const apimServices = require('./apimServices');
const azureServices = require('./azureServices');
const clientSecretValidityServices = require('./clientSecretValidityServices');
const ejs = require("ejs");

module.exports = {

    sendAzureAppRegistrationEmail: async (xid, apimAppName, org, developer) => {

        let appOwnerEmail = '';
        let teamMembersMailIds = '';
        let isTeam = false;
        let mailBody;
        let isEmailTemplateRenderError = false;
        let teamName = '';
        let toEmail = '';
        let subject = `Intel® API Management Notification: App - ${apimAppName} on ${org} is now ready to use`;

        const processTeamEmailResult = await emailServices.processTeamEmail(xid, developer);
        if (processTeamEmailResult[0] === "SUCCESS") {

            teamName = processTeamEmailResult[1].teamName;
            toEmail = processTeamEmailResult[1].senderEmail;
            teamMembersMailIds = processTeamEmailResult[1].teamMembersMailIds;
            isTeam = processTeamEmailResult[1].isTeam;
        }
        else if (processTeamEmailResult[0] === "ERROR") {
            return processTeamEmailResult;
        }

        if (teamName !== '') {
            appOwnerEmail = teamName;
        }
        else {
            appOwnerEmail = developer;
        }

        //*Get  Azure App Creation Email Template
        ejs.renderFile("./views/azureProjectCreationTemplate.ejs", { appName: apimAppName, appOwnerEmail: appOwnerEmail, isTeam: isTeam }, async function (error, htmlToSend) {
            if (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: AppCreationService.sendMail: ERROR: Failed to get azure app creation email template: Error is ${error}`);
                isEmailTemplateRenderError = true;
                return ["ERROR", `Failed to get azure app creation email template: Error is ${error}`];
            }
            else {
                mailBody = `${htmlToSend}`;
            }
        });

        //* If no team data available, add it to pending emails
        if (teamMembersMailIds === '') {
            const addPendingEmailResult = await emailServices.addPendingEmails(xid, developer, subject, mailBody);
        }

        if (!isEmailTemplateRenderError) {
            //* Send Email
            const sendEmailResult = await emailServices.sendEmail(xid, toEmail, subject, mailBody);
            if (sendEmailResult[0] === 'SUCCESS') {
                return sendEmailResult;
            }
            else if (sendEmailResult[0] === 'ERROR') {
                return sendEmailResult;
            }
        }

    },

    azureAppCreationAndUpdationInApim: async (xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, apimToken, apimConfig, apimAppName, apimAppId, org, developer, clientIdRegex, isClientSecretExpiry) => {

        //* Get App Details from apim
        let apimAppDetailsResult = await apimServices.getAppDetailsUsingAppId(xid, apimToken, apimConfig, apimAppId, org, clientIdRegex, isClientSecretExpiry);
        if (apimAppDetailsResult[0] === "SUCCESS") {

            let apimAppDetails = apimAppDetailsResult[1]; //* Apim app details

            //* Check if client secret expiry app and new key added
            if (isClientSecretExpiry && !apimAppDetails.newKeyAdded) {
                sails.log.error("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndUpdationInApim: ERROR: No new key added in application ${apimAppName} of appId ${apimAppId} under ${org} organization in apim`);
                return ['ERROR', `No new key added in application ${apimAppName} of appId ${apimAppId} under ${org} organization in apim`];
            }
            else {

                //* Create app in azure
                let appCreationResult = await azureServices.azureAppCreation(xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, org, developer, apimAppId, apimAppName);
                if (appCreationResult[0] === 'SUCCESS') {

                    let azureAppDetails = appCreationResult[1];

                    //* Update azure credentials in apim app
                    let appUpdateWithAzureCredentialsResult = await apimServices.appUpdateWithAzureCredentials(xid, apimToken, apimConfig, apimAppName, org, developer, azureAppDetails.azureClientId, azureAppDetails.azureClientSecret, apimAppDetails.previousClientId, apimAppDetails.previousProducts, apimAppDetails.previousProductsWithStatus);
                    if (appUpdateWithAzureCredentialsResult[0] === 'SUCCESS') {

                        //* Delete the old app entry from clientsecret details table if its a expiry app
                        if (isClientSecretExpiry) {
                            let deleteClientSecretValidityResult = await clientSecretValidityServices.deleteClientSecretValidity(xid, apimAppId);
                        }

                        //* Add clientsecret expiry details to database
                        let addClientSecretValidityResult = await clientSecretValidityServices.addClientSecretValidity(xid, apimAppId, org, azureAppDetails.azureObjectId, apimAppName, azureAppDetails.azureClientSecretId, azureAppDetails.azureClientSecretExpiryDate, developer);

                        //* Update application details to database
                        let azureAppIdUpdateResult = await ApplicationDetails.update({id: apimAppId, AzureRegisteredAppId: '' }).set({AzureRegisteredAppId: azureAppDetails.azureObjectId});
                        
                        //const appUpdateStatusResult = await ApigeeApp.update({ AppID: app.id, AzureRegisteredAppId: '' }).set({ AzureRegistered: 1, AzureRegisteredAppId: appRegisteredResult[1].id, AppDisplayName: app.AppName})
                        
                        sails.log.info("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndUpdationInApim: info: successfully updated the application details table `);
                
                        let azureAppregisteredUpdateResult = await ApplicationDetails.update({id: apimAppId}).set({AzureRegistered: 1});
                        sails.log.info("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndUpdationInApim: info: azure registered field updated!`);
                
                        //* Send Azure App Creation email
                        let azureAppCreationEmailResult = await module.exports.sendAzureAppRegistrationEmail(xid, apimAppName, org, developer);

                        return ['SUCCESS', `Successfully created the azure application for apim app ${apimAppName} under org ${org}. Azure object id is ${azureAppDetails.azureObjectId}`];

                    }
                    else if (appUpdateWithAzureCredentialsResult[0] === 'ERROR') {
                        let deleteAzureAppResult = await azureServices.deleteAzureApp(xid, azureToken, azureConfig, azureAppDetails.azureObjectId);
                        return appUpdateWithAzureCredentialsResult;
                    }
                }
                else if (appCreationResult[0] === 'ERROR') {
                    return appCreationResult;
                }
            }
        }
        else if (apimAppDetailsResult[0] === "ERROR") {
            return apimAppDetailsResult;
        }
    },

    azureAppCreationAndScopeAddition: async (xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, apimToken, apimConfig, apimAppName, apimAppId, org, developer, clientIdRegex, isClientSecretExpiry, scopes) => {

        //* Get App Details from apim
        let apimAppDetailsResult = await apimServices.getAppDetailsUsingAppId(xid, apimToken, apimConfig, apimAppId, org, clientIdRegex, isClientSecretExpiry);
        if (apimAppDetailsResult[0] === "SUCCESS") {

            let apimAppDetails = apimAppDetailsResult[1]; //* Apim app details

            //* Check if client secret expiry app and new key added
            if (isClientSecretExpiry && !apimAppDetails.newKeyAdded) {
                sails.log.error("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndScopeAddition: ERROR: No new key added in application ${apimAppName} of appId ${apimAppId} under ${org} organization in apim`);
                return ['ERROR', `No new key added in application ${apimAppName} of appId ${apimAppId} under ${org} organization in apim`];
            }
            else {

                //* Create app in azure
                let appCreationResult = await azureServices.azureAppCreation(xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, org, developer, apimAppId,  apimAppName);
                if (appCreationResult[0] === 'SUCCESS') {

                    let azureAppDetails = appCreationResult[1];

                    //* Update azure credentials in apim app
                    let appUpdateWithAzureCredentialsResult = await apimServices.appUpdateWithAzureCredentials(xid, apimToken, apimConfig, apimAppName, org, developer, azureAppDetails.azureClientId, azureAppDetails.azureClientSecret, apimAppDetails.previousClientId, apimAppDetails.previousProducts, apimAppDetails.previousProductsWithStatus);
                    if (appUpdateWithAzureCredentialsResult[0] === 'SUCCESS') {

                        sails.log.info("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndScopeAddition: Successfully created the azure application for apim app ${apimAppName} under org ${org}. Azure object id is ${azureAppDetails.azureObjectId}`);

                        //* Add scope
                        let scopeAdditionResult = await azureServices.addScope(xid, azureToken, azureConfig, scopes, azureAppDetails.azureObjectId, azureAppName, nononceScope);
                        if (scopeAdditionResult[0] === 'SUCCESS') {

                            //* Delete the old app entry from clientsecret details table if its a expiry app
                            if (isClientSecretExpiry) {
                                let deleteClientSecretValidityResult = await clientSecretValidityServices.deleteClientSecretValidity(xid, apimAppId);
                            }

                            //* Add clientsecret expiry details to database
                            let addClientSecretValidityResult = await clientSecretValidityServices.addClientSecretValidity(xid, apimAppId, org, azureAppDetails.azureObjectId, apimAppName, azureAppDetails.azureClientSecretId, azureAppDetails.azureClientSecretExpiryDate, developer);

                            //* Update application details to database
                            let azureAppIdUpdateResult = await ApplicationDetails.update({id: apimAppId}).set({AzureRegisteredAppId: azureAppDetails.azureObjectId});

                            //* Send Azure App Creation email
                            let azureAppCreationEmailResult = await module.exports.sendAzureAppRegistrationEmail(xid, apimAppName, org, developer);

                            
                            return ['SUCCESS', `Successfully created the azure application for apim app ${apimAppName} under org ${org} and also added scope. Azure object id is ${azureAppDetails.azureObjectId}`];
                        }
                        else if (scopeAdditionResult[0] === 'ERROR') {
                            let deleteAzureAppResult = await azureServices.deleteAzureApp(xid, azureToken, azureConfig, azureAppDetails.azureObjectId);
                            return scopeAdditionResult;
                        }

                    }
                    else if (appUpdateWithAzureCredentialsResult[0] === 'ERROR') {
                        let deleteAzureAppResult = await azureServices.deleteAzureApp(xid, azureToken, azureConfig, azureAppDetails.azureObjectId);
                        return appUpdateWithAzureCredentialsResult;
                    }
                }
                else if (appCreationResult[0] === 'ERROR') {
                    return appCreationResult;
                }
            }
        }
        else if (apimAppDetailsResult[0] === "ERROR") {
            return apimAppDetailsResult;
        }
    },

    azureAppCreationAndResourceScopeAddition: async (xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, apimToken, apimConfig, apimAppName, apimAppId, org, developer, clientIdRegex, isClientSecretExpiry, scopes) => {

        //* Get App Details from apim
        let apimAppDetailsResult = await apimServices.getAppDetailsUsingAppId(xid, apimToken, apimConfig, apimAppId, org, clientIdRegex, isClientSecretExpiry);
        if (apimAppDetailsResult[0] === "SUCCESS") {

            let apimAppDetails = apimAppDetailsResult[1]; //* Apim app details

            //* Check if client secret expiry app and new key added
            if (isClientSecretExpiry && !apimAppDetails.newKeyAdded) {
                sails.log.error("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndResourceScopeAddition: ERROR: No new key added in application ${apimAppName} of appId ${apimAppId} under ${org} organization in apim`);
                return ['ERROR', `No new key added in application ${apimAppName} of appId ${apimAppId} under ${org} organization in apim`];
            }
            else {

                //* Create app in azure
                let appCreationResult = await azureServices.azureAppCreation(xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, org, developer, apimAppId,  apimAppName);
                if (appCreationResult[0] === 'SUCCESS') {

                    let azureAppDetails = appCreationResult[1];

                    //* Update azure credentials in apim app
                    let appUpdateWithAzureCredentialsResult = await apimServices.appUpdateWithAzureCredentials(xid, apimToken, apimConfig, apimAppName, org, developer, azureAppDetails.azureClientId, azureAppDetails.azureClientSecret, apimAppDetails.previousClientId, apimAppDetails.previousProducts, apimAppDetails.previousProductsWithStatus);
                    if (appUpdateWithAzureCredentialsResult[0] === 'SUCCESS') {

                        sails.log.info("XID: " + xid + " | ", new Date, `: azureAndApimServices.azureAppCreationAndResourceScopeAddition: Successfully created the azure application for apim app ${apimAppName} under org ${org}. Azure object id is ${azureAppDetails.azureObjectId}`);

                        //* Add scope
                        let scopeAdditionResult = await azureServices.addResourceScope(xid, azureToken, azureConfig, scopes, azureAppDetails.azureObjectId, azureAppName, nononceScope);
                        if (scopeAdditionResult[0] === 'SUCCESS') {

                            //* Add resource role
                            let roleAdditionResult = await azureServices.addResourceRole(xid, azureToken, azureConfig, apimAppId, scopes, azureAppDetails.azureObjectId, azureAppName);
                            if(roleAdditionResult[0] === 'SUCCESS') {

                                //* Delete the old app entry from clientsecret details table if its a expiry app
                            if (isClientSecretExpiry) {
                                let deleteClientSecretValidityResult = await clientSecretValidityServices.deleteClientSecretValidity(xid, apimAppId);
                            }

                            //* Add clientsecret expiry details to database
                            let addClientSecretValidityResult = await clientSecretValidityServices.addClientSecretValidity(xid, apimAppId, org, azureAppDetails.azureObjectId, apimAppName, azureAppDetails.azureClientSecretId, azureAppDetails.azureClientSecretExpiryDate, developer);

                            //* Update application details to database
                            let azureAppIdUpdateResult = await ApplicationDetails.update({id: apimAppId}).set({AzureRegisteredAppId: azureAppDetails.azureObjectId});
                            
                            //* Send Azure App Creation email
                            let azureAppCreationEmailResult = await module.exports.sendAzureAppRegistrationEmail(xid, apimAppName, org, developer);

                            return ['SUCCESS', `Successfully created the azure application for apim app ${apimAppName} under org ${org} and also added resource scope and role. Azure object id is ${azureAppDetails.azureObjectId}`];
                            }
                            else if(roleAdditionResult[0] === 'ERROR') {
                                let deleteAzureAppResult = await azureServices.deleteAzureApp(xid, azureToken, azureConfig, azureAppDetails.azureObjectId);
                                return roleAdditionResult;
                            }
                            
                        }
                        else if (scopeAdditionResult[0] === 'ERROR') {
                            let deleteAzureAppResult = await azureServices.deleteAzureApp(xid, azureToken, azureConfig, azureAppDetails.azureObjectId);
                            return scopeAdditionResult;
                        }

                    }
                    else if (appUpdateWithAzureCredentialsResult[0] === 'ERROR') {
                        let deleteAzureAppResult = await azureServices.deleteAzureApp(xid, azureToken, azureConfig, azureAppDetails.azureObjectId);
                        return appUpdateWithAzureCredentialsResult;
                    }
                }
                else if (appCreationResult[0] === 'ERROR') {
                    return appCreationResult;
                }
            }
        }
        else if (apimAppDetailsResult[0] === "ERROR") {
            return apimAppDetailsResult;
        }
    }
}