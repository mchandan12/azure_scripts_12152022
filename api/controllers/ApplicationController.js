const azureAndApimServices = require('../services/azureAndApimServices');
const { v4: uuidv4 } = require('uuid');
const apimConfig = JSON.parse(process.env.APIGEE_MANAGEMENT_CONFIG);
const azureConfig = JSON.parse(process.env.AZURE_CONFIG);
const redirectUriConfig = JSON.parse(process.env.REDIRECT_URIS);
const idTokenConfig = JSON.parse(process.env.ID_TOKEN);
const accessTokenConfig = JSON.parse(process.env.ACCESS_TOKEN);
const samlTokenConfig = JSON.parse(process.env.SAML_TOKEN);
const optionalClaimsConfig = JSON.parse(process.env.OPTIONALCLAIMS_CONFIG);
const nononceConfig = JSON.parse(process.env.NONONCE_CONFIG);
//const resourceAccessConfig = JSON.parse(process.env.RESOURCE_ACCESS_CONFIG);
const httpRequestServices = require('../services/httpRequestServices');
const azureServices = require('../services/azureServices');
const logServices = require('../services/logServices');
const ApigeeAppAssociatedAPIProducts = require('../models/ApigeeAppAssociatedAPIProducts');


module.exports = {

    azureAppCreationAndUpdationOfApimApp: async (req, res) => {

        let body = req.body;
        let groupMembershipClaims = optionalClaimsConfig.groupMembershipClaims;
        let idToken = idTokenConfig.idToken;
        let accessToken = accessTokenConfig.accessToken;
        let samlToken = samlTokenConfig.saml2Token;
        let nononceScope = nononceConfig.nononceScope;
        let azureToken = body.azureToken;
        let apimToken = body.apimToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let apimAppName;
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let developer;
        let isClientSecretExpiry = body.isClientSecretExpiry;
        let clientIdRegex = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;
        //* Generate Unique Id
        let xid = uuidv4();

        
        try {

                        //* Get App Details
                        let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

                        if (appDetailsResult.length > 0) {
                            azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                            apimAppName = appDetailsResult[0].AppName;
                            developer = appDetailsResult[0].Developer;
                        }

            //* Call azure app creation and apim updation service
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppCreationAndUpdationOfApimApp: Calling azure app creation and apim app updation service");
            let azureAppCreationAndUpdationOfApimAppResult = await azureAndApimServices.azureAppCreationAndUpdationInApim(xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, apimToken, apimConfig, apimAppName, apimAppId, org, developer, clientIdRegex, isClientSecretExpiry);
            if (azureAppCreationAndUpdationOfApimAppResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndUpdationOfApimApp: ${azureAppCreationAndUpdationOfApimAppResult[1]}`);

                //* Delete the record from azure processing task table
                try {
                   // let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                    let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                    let deleteAzureTaskResult1 = await PendingAzureProcessingTasks.update({ id: apimAppId, Organization: org, Processing: 1}).set({Processing:0});
                    //sails.log.info("XID: " + xid + " | ", new Date, `ApplicationController.azureAppCreationAndUpdationOfApimApp: Successfully updated the app processing status from 1 to 0.`);

                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndUpdationOfApimApp: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', azureAppCreationAndUpdationOfApimAppResult[1]);

                res.status(200).json({ "status": azureAppCreationAndUpdationOfApimAppResult[0], "message": azureAppCreationAndUpdationOfApimAppResult[1] });
            }
            else if (azureAppCreationAndUpdationOfApimAppResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndUpdationOfApimApp: ERROR: ${azureAppCreationAndUpdationOfApimAppResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndUpdationOfApimApp: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', azureAppCreationAndUpdationOfApimAppResult[1]);

                res.status(200).json({ "status": azureAppCreationAndUpdationOfApimAppResult[0], "message": azureAppCreationAndUpdationOfApimAppResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndUpdationOfApimApp: ERROR: Failed to create azure app and update apim app. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndUpdationOfApimApp: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to create azure app and update apim app. Error is ${error}` });
        }

    },

    azureAppCreationAndScopeAddition: async (req, res) => {

        let body = req.body;
        let groupMembershipClaims = optionalClaimsConfig.groupMembershipClaims;
        let idToken = idTokenConfig.idToken;
        let accessToken = accessTokenConfig.accessToken;
        let samlToken = samlTokenConfig.saml2Token;
        let nononceScope = nononceConfig.nononceScope;
        let azureToken = body.azureToken;
        let apimToken = body.apimToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let apimAppName;
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let developer;
        let isClientSecretExpiry = body.isClientSecretExpiry;
        let clientIdRegex = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;

        //* Generate Unique Id
        let xid = uuidv4();

        try {

                       //* Get App Details
                       let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

                       if (appDetailsResult.length > 0) {
                        azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                        apimAppName = appDetailsResult[0].AppName;
                        developer = appDetailsResult[0].Developer;
                       }

            //* Call azure app creation, apim updation service and scope addition
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppCreationAndScopeAddition: Calling azure app creation, apim app updation and scope addition service");
            let azureAppCreationAndScopeAdditionResult = await azureAndApimServices.azureAppCreationAndScopeAddition(xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, apimToken, apimConfig, apimAppName, apimAppId, org, developer, clientIdRegex, isClientSecretExpiry, scopes);
            if (azureAppCreationAndScopeAdditionResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndScopeAddition: ${azureAppCreationAndScopeAdditionResult[1]}`);

                //* Delete the record from azure processing task table
                try {
                   // let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                   let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});

                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndScopeAddition: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', azureAppCreationAndScopeAdditionResult[1]);

                res.status(200).json({ "status": azureAppCreationAndScopeAdditionResult[0], "message": azureAppCreationAndScopeAdditionResult[1] });
            }
            else if (azureAppCreationAndScopeAdditionResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndScopeAddition: ERROR: ${azureAppCreationAndScopeAdditionResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndScopeAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', azureAppCreationAndScopeAdditionResult[1]);

                res.status(200).json({ "status": azureAppCreationAndScopeAdditionResult[0], "message": azureAppCreationAndScopeAdditionResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndScopeAddition: ERROR: Failed to create azure app and update apim app. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndScopeAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to create azure app and update apim app. Error is ${error}` });
        }

    },

    azureAppScopeAddition: async (req, res) => {

        let body = req.body;
        let nononceScope = nononceConfig.nononceScope;
        let azureToken = body.azureToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let azureAppId;
        let apimAppName;

        //* Generate Unique Id
        let xid = uuidv4();

        try {

                        //* Get App Details
                        let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

                        if (appDetailsResult.length > 0) {
                            azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                            azureAppId = appDetailsResult[0].AzureRegisteredAppId;
                            apimAppName = appDetailsResult[0].AppName;
                        }

            //* Call azure app scope addition
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppScopeAddition: Calling azure app scope addition service");
            let scopeAdditionResult = await azureServices.addScope(xid, azureToken, azureConfig, scopes, azureAppId, azureAppName, nononceScope, apimAppId, type, action, org);
            if (scopeAdditionResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeAddition: ${scopeAdditionResult[1]}`);

                //* Delete the record from azure processing task table
                try {
                    //let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                    let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                    let deleteAzureTaskResult1 = await PendingAzureProcessingTasks.update({ id: apimAppId, Organization: org, Processing: 1}).set({Processing:0});
                    //sails.log.info("XID: " + xid + " | ", new Date, `ApplicationController.azureAppCreationAndUpdationOfApimApp: Successfully updated the app processing status from 1 to 0.`);
                    //let updateappassociatedproductResult = await ApigeeAppAssociatedAPIProducts.update({ id: apimAppId}).set({ScopeAdditionInAzure:1});
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeAddition: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', scopeAdditionResult[1]);

                res.status(200).json({ "status": scopeAdditionResult[0], "message": scopeAdditionResult[1] });
            }
            else if (scopeAdditionResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeAddition: ERROR: ${scopeAdditionResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', scopeAdditionResult[1]);

                res.status(200).json({ "status": scopeAdditionResult[0], "message": scopeAdditionResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeAddition: ERROR: Failed to add scope for app ${apimAppName}. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to add scope for app ${apimAppName}. Error is ${error}` });
        }

    },

    azureAppScopeRemoval: async (req, res) => {

        let body = req.body;
        let azureToken = body.azureToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let azureAppId;
        let apimAppName;

        //* Generate Unique Id
        let xid = uuidv4();

        try {

            //* Get App Details
            let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

            if (appDetailsResult.length > 0) {
                azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                azureAppId = appDetailsResult[0].AzureRegisteredAppId;
                apimAppName = appDetailsResult[0].AppName;
            }

            //* Call azure app scope removal
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppScopeRemoval: Calling azure app scope removal service");
            let scopeRemovalResult = await azureServices.removeScope(xid, azureToken, azureConfig, scopes, azureAppId, azureAppName);
            if (scopeRemovalResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeRemoval: ${scopeRemovalResult[1]}`);

                //* Delete the record from azure processing task table
                try {
                    //let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                    let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                    let deleteAzureTaskResult1 = await PendingAzureProcessingTasks.update({ id: apimAppId, Organization: org, Processing: 1}).set({Processing:0});
                    //sails.log.info("XID: " + xid + " | ", new Date, `ApplicationController.azureAppCreationAndUpdationOfApimApp: Successfully updated the app processing status from 1 to 0.`);

                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeRemoval: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', scopeRemovalResult[1]);

                res.status(200).json({ "status": scopeRemovalResult[0], "message": scopeRemovalResult[1] });
            }
            else if (scopeRemovalResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeRemoval: ERROR: ${scopeRemovalResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', scopeRemovalResult[1]);

                res.status(200).json({ "status": scopeRemovalResult[0], "message": scopeRemovalResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeRemoval: ERROR: Failed to remove scope for app ${apimAppName}. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppScopeRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to remove scope for app ${apimAppName}. Error is ${error}` });
        }

    },

    azureAppCreationAndResourceScopeAddition: async (req, res) => {

        let body = req.body;
        let groupMembershipClaims = optionalClaimsConfig.groupMembershipClaims;
        let idToken = idTokenConfig.idToken;
        let accessToken = accessTokenConfig.accessToken;
        let samlToken = samlTokenConfig.saml2Token;
        let nononceScope = nononceConfig.nononceScope;
        let azureToken = body.azureToken;
        let apimToken = body.apimToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let apimAppName;
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let developer;
        let isClientSecretExpiry = body.isClientSecretExpiry;
        let clientIdRegex = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;
        //console.log("samlToken is",samlToken)

        //* Generate Unique Id
        let xid = uuidv4();

        try {

              //* Get App Details
              let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

              if (appDetailsResult.length > 0) {
                azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                apimAppName = appDetailsResult[0].AppName;
                developer = appDetailsResult[0].Developer;
              }

            //* Call azure app creation, apim updation service and resource scope/role addition
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppCreationAndResourceScopeAddition: Calling azure app creation, apim app updation and resource scope/role addition service");
            let azureAppCreationAndScopeAdditionResult = await azureAndApimServices.azureAppCreationAndResourceScopeAddition(xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, apimToken, apimConfig, apimAppName, apimAppId, org, developer, clientIdRegex, isClientSecretExpiry, scopes);
            if (azureAppCreationAndScopeAdditionResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndResourceScopeAddition: ${azureAppCreationAndScopeAdditionResult[1]}`);

                //* Delete the record from azure processing task table
                try {
                   // let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                   let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                   // let deleteAzureTaskResult1 = await ApigeeAppAssociatedAPIProducts.update({ id: apimAppId,   })
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndResourceScopeAddition: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', azureAppCreationAndScopeAdditionResult[1]);

                res.status(200).json({ "status": azureAppCreationAndScopeAdditionResult[0], "message": azureAppCreationAndScopeAdditionResult[1] });
            }
            else if (azureAppCreationAndScopeAdditionResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndResourceScopeAddition: ERROR: ${azureAppCreationAndScopeAdditionResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndResourceScopeAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', azureAppCreationAndScopeAdditionResult[1]);

                res.status(200).json({ "status": azureAppCreationAndScopeAdditionResult[0], "message": azureAppCreationAndScopeAdditionResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndResourceScopeAddition: ERROR: Failed to create azure app and update apim app. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppCreationAndResourceScopeAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to create azure app and update apim app. Error is ${error}` });
        }

    },

    azureAppResourceScopeAndRoleAddition: async (req, res) => {

        let body = req.body;
        let nononceScope = nononceConfig.nononceScope;
        let azureToken = body.azureToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let azureAppId;
        let apimAppName;

        //* Generate Unique Id
        let xid = uuidv4();

        try {

                        //* Get App Details
                        let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

                        if (appDetailsResult.length > 0) {
                            azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                            azureAppId = appDetailsResult[0].AzureRegisteredAppId;
                            apimAppName = appDetailsResult[0].AppName;
                        }
            //console.log('app id :' , apimAppId )
            //console.log('resource scopes to be added :' , scopes )

            //* Call azure app resource scope addition
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppResourceScopeAndRoleAddition: Calling azure app resource scope addition service");
            let scopeAdditionResult = await azureServices.addResourceScope(xid, azureToken, azureConfig, scopes, azureAppId, azureAppName, nononceScope, apimAppId, type, action, org);
            if (scopeAdditionResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ${scopeAdditionResult[1]}`);

                //console.log('resource access config : ', resourceAccessConfig.requiredResourceAccess)

                //* Call azure app resource role addition
                let roleAdditionResult = await azureServices.addResourceRole(xid, azureToken, azureConfig, apimAppId, scopes, azureAppId, azureAppName);
                if (roleAdditionResult[0] === 'SUCCESS') {

                    sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ${roleAdditionResult[1]}`);
                     
                    //* Delete the record from azure processing task table
                    try {
                        //let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                        let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                        let deleteAzureTaskResult1 = await PendingAzureProcessingTasks.update({ id: apimAppId, Organization: org, Processing: 1}).set({Processing:0});
                    //sails.log.info("XID: " + xid + " | ", new Date, `ApplicationController.azureAppCreationAndUpdationOfApimApp: Successfully updated the app processing status from 1 to 0.`);

                    }
                    catch (error) {
                        sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                    }

                    //* Update the azure log table
                    let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', roleAdditionResult[1]);

                    res.status(200).json({ "status": roleAdditionResult[0], "message": roleAdditionResult[1] });
                }
                else if (roleAdditionResult[0] === 'ERROR') {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: ${roleAdditionResult[1]}`);

                    //* Update the record from azure processing task table to 2 to show it as error
                    try {
                        let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                    }
                    catch (error) {
                        sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                    }

                    //* Update the azure log table
                    let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', roleAdditionResult[1]);

                    res.status(200).json({ "status": roleAdditionResult[0], "message": roleAdditionResult[1] });
                }

               
            }
            else if (scopeAdditionResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: ${scopeAdditionResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', scopeAdditionResult[1]);

                res.status(200).json({ "status": scopeAdditionResult[0], "message": scopeAdditionResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: Failed to add resource scope/role for app ${apimAppName}. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleAddition: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to add resource scope/role for app ${apimAppName}. Error is ${error}` });
        }

    },

    azureAppResourceScopeAndRoleRemoval: async (req, res) => {

        let body = req.body;
        let azureToken = body.azureToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let azureAppId;
        let apimAppName;

        //* Generate Unique Id
        let xid = uuidv4();

        try {

            //* Get App Details
            let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

            if (appDetailsResult.length > 0) {
                azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                azureAppId = appDetailsResult[0].AzureRegisteredAppId;
                apimAppName = appDetailsResult[0].AppName;
            }
            //* Call azure app resource scope removal
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppResourceScopeAndRoleRemoval: Calling azure app resource scope and role removal service");
            let scopeRemovalResult = await azureServices.removeResourceScope(xid, azureToken, azureConfig, scopes, azureAppId, azureAppName);
            if (scopeRemovalResult[0] === 'SUCCESS') {

                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ${scopeRemovalResult[1]}`);

                //* Remove resource role
                let roleRemovalResult = await azureServices.removeResourceRole(xid, azureToken, azureConfig, scopes, azureAppId, azureAppName);
                if(roleRemovalResult[0] === 'SUCCESS') {

                    sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ${roleRemovalResult[1]}`);

                    //* Delete the record from azure processing task table
                    try {
                        //let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                        let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                        let deleteAzureTaskResult1 = await PendingAzureProcessingTasks.update({ id: apimAppId, Organization: org, Processing: 1}).set({Processing:0});
                    //sails.log.info("XID: " + xid + " | ", new Date, `ApplicationController.azureAppCreationAndUpdationOfApimApp: Successfully updated the app processing status from 1 to 0.`);

                    }
                    catch (error) {
                        sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                    }

                    //* Update the azure log table
                    let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', roleRemovalResult[1]);

                    res.status(200).json({ "status": roleRemovalResult[0], "message": roleRemovalResult[1] });

                }
                else if(roleRemovalResult[0] === 'ERROR') {

                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: ${roleRemovalResult[1]}`);

                    //* Update the record from azure processing task table to 2 to show it as error
                    try {
                        let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                    }
                    catch (error) {
                        sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                    }

                    //* Update the azure log table
                    let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', roleRemovalResult[1]);

                    res.status(200).json({ "status": roleRemovalResult[0], "message": roleRemovalResult[1] });

                }
                
            }
            else if (scopeRemovalResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: ${scopeRemovalResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', scopeRemovalResult[1]);

                res.status(200).json({ "status": scopeRemovalResult[0], "message": scopeRemovalResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: Failed to remove resource scope for app ${apimAppName}. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceScopeAndRoleRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to remove resource scope for app ${apimAppName}. Error is ${error}` });
        }

    },

    azureAppResourceRoleRemoval: async (req, res) => {

        let body = req.body;
        let azureToken = body.azureToken;
        let azureAppName;
        let apimAppId = req.param('appId');
        let org = req.param('org');
        let type = body.type;
        let action = body.action;
        let scopes = body.scopes;
        let azureAppId;
        let apimAppName;

        //* Generate Unique Id
        let xid = uuidv4();

        try {

                        
            //* Get App Details
            let appDetailsResult = await ApplicationDetails.find({ id: apimAppId , ClientSecretExpired : 0}).sort('updatedAt DESC');

            if (appDetailsResult.length > 0) {
                azureAppName = appDetailsResult[0].AzureRegisteredAppName;
                azureAppId = appDetailsResult[0].AzureRegisteredAppId;
                apimAppName = appDetailsResult[0].AppName;
            }

            //* Call azure app resource role removal
            sails.log.info("XID: " + xid + " | ", new Date, ": ApplicationController.azureAppResourceRoleRemoval: Calling azure app resource role removal service");
            let scopeRemovalResult = await azureServices.removeResourceRole(xid, azureToken, azureConfig, scopes, azureAppId, azureAppName);
            if (scopeRemovalResult[0] === 'SUCCESS') {
                sails.log.info("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceRoleRemoval: ${scopeRemovalResult[1]}`);

                //* Delete the record from azure processing task table
                try {
                   // let deleteAzureTaskResult = await PendingAzureProcessingTasks.destroy({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes });
                   let deleteAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({Processing:4});
                   let deleteAzureTaskResult1 = await PendingAzureProcessingTasks.update({ id: apimAppId, Organization: org, Processing: 1}).set({Processing:0});
                    //sails.log.info("XID: " + xid + " | ", new Date, `ApplicationController.azureAppCreationAndUpdationOfApimApp: Successfully updated the app processing status from 1 to 0.`);

                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceRoleRemoval: ERROR: Failed to delete the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'success', scopeRemovalResult[1]);

                res.status(200).json({ "status": scopeRemovalResult[0], "message": scopeRemovalResult[1] });
            }
            else if (scopeRemovalResult[0] === 'ERROR') {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceRoleRemoval: ERROR: ${scopeRemovalResult[1]}`);

                //* Update the record from azure processing task table to 2 to show it as error
                try {
                    let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
                }
                catch (error) {
                    sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceRoleRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
                }

                //* Update the azure log table
                let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', scopeRemovalResult[1]);

                res.status(200).json({ "status": scopeRemovalResult[0], "message": scopeRemovalResult[1] });
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceRoleRemoval: ERROR: Failed to remove resource role for app ${apimAppName}. Error is ${error}`);

            //* Update the record from azure processing task table to 2 to show it as error
            try {
                let updateAzureTaskResult = await PendingAzureProcessingTasks.update({ id: apimAppId, Type: type, Organization: org, Action: action, SecondaryIdentifier: scopes }).set({ Processing: 2 });
            }
            catch (error) {
                sails.log.error("XID: " + xid + " | ", new Date, `: ApplicationController.azureAppResourceRoleRemoval: ERROR: Failed to update the entry from azure task table for app id ${apimAppId} of type ${type} under ${org} organization. Error is ${error}`);
            }

            //* Update the azure log table
            let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, scopes, type, action, org, 'error', error);

            res.status(200).json({ "status": "ERROR", "message": `Failed to remove resource role for app ${apimAppName}. Error is ${error}` });
        }

    },

    
}