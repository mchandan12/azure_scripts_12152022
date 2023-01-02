const httpRequestServices = require('./httpRequestServices');
const { v4: uuidv4 } = require('uuid');
const _ =require('lodash')
const findIndex = _.findIndex
const difference =_.differenceWith
const isEqual=_.isEqual

module.exports = {
    registerAppInAzure: async (xid, azureToken, config, appName) => {

        let postBody = {
            "displayName": appName
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.registerAppInAzure: Calling azure service to create application in azure");

        //*Create the App in Azure
        let appCreationResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}`, 'POST', postBody, 'json');
        if (appCreationResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.registerAppInAzure: Application ${appName} creation on azure is successfull`);
            return appCreationResult;
        }
        else if (appCreationResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.registerAppInAzure: ERROR: Failed to create application ${appName} in azure. Error is ${appCreationResult[1]}`);
            return ['ERROR', `Failed to create application ${appName} in azure. Error is ${appCreationResult[1]}`];
        }

    },

    createClientSecret: async (xid, azureToken, config, appName, azureId) => {
        const currentDate = new Date();
        const startDateTime = new Date(new Date().toISOString());
        const endDateTime = new Date(new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)).toISOString());
        let postBody = {
            "passwordCredential": {
                "displayName": appName,
                "endDateTime": endDateTime,
                "startDateTime": startDateTime
            }
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.createClientSecret: Calling azure service to create client secret");

        //*Create the Client Secret
        let secretCreationResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}/addpassword`, 'POST', postBody, 'json');
        if (secretCreationResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.createClientSecret: Client secret creation for application ${appName} is successfull`);
            return secretCreationResult;
        }
        else if (secretCreationResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.createClientSecret: ERROR: Failed to create client secret for application ${appName}. Error is ${secretCreationResult[1]}`);
            return ['ERROR', `Failed to create client secret for application ${appName}. Error is ${secretCreationResult[1]}`];
        }
    },

    addRedirectURI: async (xid, azureToken, config, redirectUriConfig, azureId) => {

        let postBody = {
            "publicClient":
            {
                "redirectUris": [
                ]
            },
            "web": {
                "redirectUris": redirectUriConfig.redirectUris
            }
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addRedirectURI: Calling azure service to add redirect URIs");
        //Create the AppSecret in Azure
        let redirectUrisResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}`, 'PATCH', postBody, 'json');
        if (redirectUrisResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addRedirectURI: Redirect URIs successfully added for application ${azureId}`);
            return redirectUrisResult;
        }
        else if (redirectUrisResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addRedirectURI: ERROR: Failed to add Redirect URIs for application ${azureId}. Error is ${redirectUrisResult[1]}`);
            return ['ERROR', `Failed to add Redirect URIs for application ${azureId}. Error is ${redirectUrisResult[1]}`];
        }
    },

    addApplicationURI: async (xid, azureToken, config, azureId, azureClientId) => {

        let postBody = {
            "identifierUris": [`api://${azureClientId}`]
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addApplicationURI: Calling azure service to add application URI");

        //*Create the AppSecret in Azure
        let applicationUriResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}`, 'PATCH', postBody, 'json');
        if (applicationUriResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addApplicationURI: Application URI successfully added for application ${azureId}`);
            return applicationUriResult;
        }
        else if (applicationUriResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addApplicationURI: ERROR: Failed to add Application URI for application ${azureId}. Error is ${applicationUriResult[1]}`);
            return ['ERROR', `Failed to add Application URI for application ${azureId}. Error is ${applicationUriResult[1]}`];
        }
    },

    addOptionalClaims: async (xid, azureToken, config, groupMembershipClaims, idToken, accessToken, samlToken, azureId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addOptionalClaims: Calling the azure service to add optional claims");
        let postBody = {
            "groupMembershipClaims": groupMembershipClaims,
            "optionalClaims": {
                "idToken": idToken,
                "accessToken": accessToken,
                "saml2Token": samlToken
            }
        }

        //*Add the Optional Claims
        let claimsResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}`, 'PATCH', postBody, 'json');
        if (claimsResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addOptionalClaims: Optional claims successfully added for application ${azureId}`);
            return claimsResult;
        }
        else if (claimsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addOptionalClaims: ERROR: Failed to add Optional claims for application ${azureId}. Error is: ${claimsResult[1]}`);
            return ['ERROR', `Failed to add Optional claims for application ${azureId}. Error is: ${claimsResult[1]}`];
        }

    },

    deleteAzureApp: async (xid, azureToken, config, azureId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.deleteAzureApp: Calling the azure service to delete application");

        //*Delete the azure application
        let deleteAppResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}`, 'DELETE', null, 'json');
        if (deleteAppResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.deleteAzureApp: Successfully deleted the azure application ${azureId}`);
            return deleteAppResult;
        }
        else if (deleteAppResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.deleteAzureApp: ERROR: Failed to delete the azure applicaiton ${azureId}. Error is ${deleteAppResult[1]}`);
            return ['ERROR', `Failed to delete the azure applicaiton ${azureId}. Error is ${deleteAppResult[1]}`];
        }

    },

    getManifestFile: async (xid, azureToken, config, azureId) => {
        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.getManifestFile: Calling azure service to get Manifest File");

        //*Get the manifest file
        let manifestResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}`, 'GET', null, 'json');
        if (manifestResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.getManifestFile: Successfully received the manifest details of application ${azureId}`);
            return manifestResult;
        }
        else if (manifestResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getManifestFile: ERROR: Failed to get the manifest file of application ${azureId}. Error is ${manifestResult[1]}`);
            return ['ERROR', `Failed to get the manifest file of application ${azureId}. Error is ${manifestResult[1]}`];
        }

    },

    getManifestFileWithClientId: async (xid, azureToken, config, azureClientId, azureId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.getManifestFileWithClientId:Calling azure service to get manifest file using client id");

        //*Get the manifest file using client id
        let manifestWithClientIdResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}?$filter=appId eq '${azureClientId}'`, 'GET', null, 'json');
        if (manifestWithClientIdResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.getManifestFileWithClientId: Successfully received the manifest details of application ${azureId} using client id`);
            return manifestWithClientIdResult;
        }
        else if (manifestWithClientIdResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getManifestFileWithClientId: ERROR: Failed to get the manifest file of application ${azureId} using client id ${azureClientId}. Error is ${manifestWithClientIdResult[1]}`);
            return ['ERROR', `Failed to get the manifest file of application ${azureId} using client id ${azureClientId}. Error is ${manifestWithClientIdResult[1]}`];
        }

    },

    createServicePrinciple: async (xid, azureToken, config, azureAppName, azureClientId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.createServicePrinciple: Calling azure service to create service principle");
        let postBody = {
            "appId": `${azureClientId}`,
            "DisplayName": `${azureAppName}`
        }

        //* Create service principle
        let servicePrincipleCreationResult = await httpRequestServices.request(xid, azureToken, `${config.servicePrincipalApi}`, 'POST', postBody, 'json');
        if (servicePrincipleCreationResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.createServicePrinciple: Service principle successfully created for application ${azureAppName}`);
            return servicePrincipleCreationResult;
        }
        else if (servicePrincipleCreationResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.createServicePrinciple: ERROR: Failed to create service principle for application ${azureAppName}. Error is ${servicePrincipleCreationResult[1]}`);
            return ['ERROR', `Failed to create service principle for application ${azureAppName}. Error is ${servicePrincipleCreationResult[1]}`];
        }

    },

    addNononceScopeValue: async (xid, azureToken, config, azureId, azureClientId, nononceScope) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addNononceScopeValue: Calling azure service to add nononce scope");

        //* Add GUID for nononce scope
        nononceScope[0]['id'] = `${uuidv4()}`;
        let postBody = {
            "identifierUris": [`api://${azureClientId}`],
            "api": {
                "oauth2PermissionScopes": nononceScope
            }
        }

        let addNononceScopeResult = await httpRequestServices.request(xid, azureToken, `${config.azureApi}/${azureId}`, 'PATCH', postBody, 'json');
        if (addNononceScopeResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addNononceScopeValue: Successfully added the nononce scope for application ${azureId} `);
            return addNononceScopeResult;
        }
        else if (addNononceScopeResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addNononceScopeValue: ERROR: Failed to add the nononce scope for applicaiton ${azureId}. Error is ${addNononceScopeResult[1]}`);
            return ['ERROR', `Failed to add the nononce scope for applicaiton ${azureId}. Error is ${addNononceScopeResult[1]}`];
        }

    },

    azureAppCreation: async (xid, azureToken, azureConfig, azureAppName, redirectUriConfig, groupMembershipClaims, idToken, accessToken, samlToken, nononceScope, org, developerName, appId, apimAppName) => {

        let azureObjectId = '';
        let azureClientId = '';
        let azureClientSecret = '';
        let azureClientSecretId = '';
        let azureClientSecretExpiryDate;

        //* Create Application in Azure
        let azureAppCreationResult = await module.exports.registerAppInAzure(xid, azureToken, azureConfig, azureAppName);
        if (azureAppCreationResult[0] === 'SUCCESS') {

            //* Get objectId, clientId and name of newly created App
            azureObjectId = azureAppCreationResult[1].id;
            azureClientId = azureAppCreationResult[1].appId;

            //* Create Client Secret
            let createClientSecretResult = await module.exports.createClientSecret(xid, azureToken, azureConfig, azureAppName, azureObjectId);
            if (createClientSecretResult[0] === 'SUCCESS') {

                //* Get Client secret, secretid and expiry date
                azureClientSecret = createClientSecretResult[1].secretText;
                azureClientSecretId = createClientSecretResult[1].keyId;
                azureClientSecretExpiryDate = new Date(createClientSecretResult[1].endDateTime);

                //* Add Redirect URI
                let addRedirectUriResult = await module.exports.addRedirectURI(xid, azureToken, azureConfig, redirectUriConfig, azureObjectId);
                if (addRedirectUriResult[0] === 'SUCCESS') {

                    //* Add Application URI
                    let addApplicationUriResult = await module.exports.addApplicationURI(xid, azureToken, azureConfig, azureObjectId, azureClientId);
                    if (addApplicationUriResult[0] === 'SUCCESS') {

                        //* Add Optional Claims
                        let addOptionalClaimsResult = await module.exports.addOptionalClaims(xid, azureToken, azureConfig, groupMembershipClaims, idToken, accessToken, samlToken, azureObjectId);
                        if (addOptionalClaimsResult[0] === 'SUCCESS') {

                            //* Create Service Principle
                            let createServicePrincipleResult = await module.exports.createServicePrinciple(xid, azureToken, azureConfig, azureAppName, azureClientId);
                            if (createServicePrincipleResult[0] === 'SUCCESS') {

                                //* Add nononce scope
                                let addNononceScopeResult = await module.exports.addNononceScopeValue(xid, azureToken, azureConfig, azureObjectId, azureClientId, nononceScope);
                                if (addNononceScopeResult[0] === 'SUCCESS') {

                                    //* Return all the azure app details
                                    let azureAppDetails = {
                                        "azureObjectId": azureObjectId,
                                        "azureClientId": azureClientId,
                                        "azureClientSecret": azureClientSecret,
                                        "azureClientSecretId": azureClientSecretId,
                                        "azureClientSecretExpiryDate": azureClientSecretExpiryDate
                                    }
                                    sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.azureAppCreation: Successfully created azure application ${azureAppName} of id ${azureObjectId}`);
                                    
                                    //update azure application details table 

                                    let azureAppData = {
                                        "id": appId,
                                        "ApigeeAppName": apimAppName,
                                        "AzureObjectId": azureObjectId,
                                        "AzureSecretKeyId": azureClientSecretId,
                                        "AzureSecretExpire": azureClientSecretExpiryDate,
                                        "Organization": org,
                                        "EmailAlertFlag": 0,
                                        "Developer": developerName,
                                        "ConsumerKey": azureClientId
                                        
                                        }
                                         let azureApplicationDetailsAddRecordResult = await AzureApplicationDetails.create(azureAppData);

                                    //let mail = await module.exports.sendMail(xid, mailConfig, apigeeAppName, org, developerName);


                                    return ['SUCCESS', azureAppDetails];
                                }
                                else if (addNononceScopeResult[0] === 'ERROR') {
                                    let deleteAzureAppResult = await module.exports.deleteAzureApp(xid, azureToken, azureConfig, azureObjectId);
                                    return addNononceScopeResult;
                                }
                            }
                            else if (createServicePrincipleResult[0] === 'ERROR') {
                                let deleteAzureAppResult = await module.exports.deleteAzureApp(xid, azureToken, azureConfig, azureObjectId);
                                return createServicePrincipleResult;
                            }
                        }
                        else if (addOptionalClaimsResult[0] === 'ERROR') {
                            let deleteAzureAppResult = await module.exports.deleteAzureApp(xid, azureToken, azureConfig, azureObjectId);
                            return addOptionalClaimsResult;
                        }
                    }
                    else if (addApplicationUriResult[0] === 'ERROR') {
                        let deleteAzureAppResult = await module.exports.deleteAzureApp(xid, azureToken, azureConfig, azureObjectId);
                        return addApplicationUriResult;
                    }
                }
                else if (addRedirectUriResult[0] === 'ERROR') {
                    let deleteAzureAppResult = await module.exports.deleteAzureApp(xid, azureToken, azureConfig, azureObjectId);
                    return addRedirectUriResult;
                }
            }
            else if (createClientSecretResult[0] === 'ERROR') {
                let deleteAzureAppResult = await module.exports.deleteAzureApp(xid, azureToken, azureConfig, azureObjectId);
                return createClientSecretResult;
            }
        }
        else if (azureAppCreationResult[0] === 'ERROR') {
            return azureAppCreationResult;
        }
    },

    updateResourceRoleValue: async (xid, azureToken, azureConfig, azureObjectId, postBody) => {
        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.updateResourceRoleValue: Calling the azure service for adding/updating resource role value");
        //console.log(postBody)
        //console.log(postBody.requiredResourceAccess[1].resourceAccess)
        let updateResourceValueResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.azureApi}/${azureObjectId}`, 'PATCH', postBody, 'json');
        if (updateResourceValueResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.updateResourceRoleValue: Successfully added/updated the resource role values for azure application ${azureObjectId}`);
            return ['SUCCESS', `Successfully added/updated the resource role values for azure application ${azureObjectId}`];
        }
        else if (updateResourceValueResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.updateResourceRoleValue: ERROR: Failed to add/update the resource role values for azure application ${azureObjectId}. Error is ${updateResourceValueResult[1]}`);
            return ['ERROR', `Failed to add/update the resource role values for azure application ${azureObjectId}. Error is ${updateResourceValueResult[1]}`];
        }
    },

    getServicePrincipleDetails: async (xid, azureToken, azureConfig, azureClientId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.getServicePrincipleDetails: Calling the azure service for fetching the service principle details");

        //* Get the service principle details
        let servicePrincipleDetailsResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}?$filter=appId eq '${azureClientId}'`, 'GET', null, 'json');

        if (servicePrincipleDetailsResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.getServicePrincipleDetails: Successfully received the service principle details for azure clientId ${azureClientId}`);
            return servicePrincipleDetailsResult;
        }
        else if (servicePrincipleDetailsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getServicePrincipleDetails: ERROR: Failed to get service principle details for azure clientId ${azureClientId}. Error is ${servicePrincipleDetailsResult[1]}`);
            return ['SUCCESS', `Failed to get service principle details for azure clientId ${azureClientId}. Error is ${servicePrincipleDetailsResult[1]}`];
        }

    },

    getAzureGroupDetails: async (xid, azureToken, azureConfig, azureGroupName) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.getAzureGroupDetails: Calling the azure service for fetching the group details");

        //* Get the group details
        let groupDetailsResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.groupsApi}?$filter=displayName eq '${azureGroupName}'`, 'GET', null, 'json');

        if (groupDetailsResult[0] === 'SUCCESS' && groupDetailsResult[1].value.length > 0) {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.getAzureGroupDetails: Successfully received the details of azure group ${azureGroupName}`);
            return groupDetailsResult;
        }
        else if (groupDetailsResult[0] === 'SUCCESS' && groupDetailsResult[1].value.length == 0) {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getAzureGroupDetails: ERROR: The group ${azureGroupName} not found in azure`);
            return ["ERROR", `The group ${azureGroupName} not found in azure`];
        }
        else if (groupDetailsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getAzureGroupDetails: ERROR: Failed to get details of group ${azureGroupName}. Error is ${groupDetailsResult[1]}`);
            return ["ERROR", `Failed to get details of group ${azureGroupName}. Error is ${groupDetailsResult[1]}`];
        }

    },

    getApplicationAssociatedGroups: async (xid, azureToken, azureConfig, azureServicePrincipleId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.getApplicationAssociatedGroups: Calling the azure service for fetching the groups associated with application");

        //* Get application associated groups
        let applicationAssociatedGroupsResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${azureServicePrincipleId}/appRoleAssignedTo`, 'GET', null, 'json');
        if (applicationAssociatedGroupsResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.getApplicationAssociatedGroups: Successfully recevied the grous associated with application ${azureServicePrincipleId}`);
            return applicationAssociatedGroupsResult;
        }
        else if (applicationAssociatedGroupsResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getApplicationAssociatedGroups: ERROR: Failed to get groups associated with application ${azureServicePrincipleId}. Error is ${applicationAssociatedGroupsResult[1]}`);
            return ['ERROR', `Failed to get groups associated with application ${azureServicePrincipleId}. Error is ${applicationAssociatedGroupsResult[1]}`];
        }
    },

    addApplicationToGroup: async (xid, azureToken, azureConfig, azureAppName, managedAppObjetId, azureGroupName, groupObjectId) => {

        let postBody = {
            "appRoleId": "00000000-0000-0000-0000-000000000000",
            "principalDisplayName": `${azureGroupName}`,
            "principalId": `${groupObjectId}`,
            "principalType": "Group",
            "resourceDisplayName": `${azureAppName}`,
            "resourceId": `${managedAppObjetId}`
        }

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addApplicationToGroup: Calling the azure service for adding application to azure group");

        //* Add application to group
        let addApplicationToGroupResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.groupsApi}/${groupObjectId}/appRoleAssignments`, 'POST', postBody, 'json');

        if (addApplicationToGroupResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addApplicationToGroup: Successfully added the application ${azureAppName} to group ${azureGroupName}`);
            return ['SUCCESS', `Successfully added the application ${azureAppName} to group ${azureGroupName}`];
        }
        else if (addApplicationToGroupResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addApplicationToGroup: Failed to add application ${azureAppName} to group ${azureGroupName}. Error is ${addApplicationToGroupResult[1]}`);
            return ['ERROR', `Failed to add application ${azureAppName} to group ${azureGroupName}. Error is ${addApplicationToGroupResult[1]}`];
        }

    },

    getAdminConsentAssociatedToApplication: async (xid, azureToken, azureConfig, servicePrincipleId,) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.getAdminConsentAssociatedToApplication: Calling the azure service for fetching the admin consents associated to application");

        //* Get admin consent associated to application
        let adminConsentAssociatedToApplicationResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${servicePrincipleId}/appRoleAssignments`, 'GET', null, 'json');
        if (adminConsentAssociatedToApplicationResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.getAdminConsentAssociatedToApplication: Successfully recevied the admin consents associated to application serviceprinciple ${servicePrincipleId}.`);
            return adminConsentAssociatedToApplicationResult;
        }
        else if (adminConsentAssociatedToApplicationResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.getAdminConsentAssociatedToApplication: ERROR: Failed to get the admin consents associated to application serviceprinciple ${servicePrincipleId}. Error is ${adminConsentAssociatedToApplicationResult[1]}`);
            return ['ERROR', `Failed to get the admin consents associated to application serviceprinciple ${servicePrincipleId}. Error is ${adminConsentAssociatedToApplicationResult[1]}`];
        }
    },

    deleteApplicationAssociatedToGroup: async (xid, azureToken, azureConfig, groupObjectId, groupId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.deleteApplicationAssociatedToGroup: Calling the azure service to delete application associated to group");

        //* Delete application associated to group 
        let deleteApplicationAssociatedToGroupResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.groupsApi}/${groupObjectId}/appRoleAssignments/${groupId}`, 'DELETE', null, 'json');
        if (deleteApplicationAssociatedToGroupResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.deleteApplicationAssociatedToGroup: Successfully deleted the group ${groupId} from the object ${groupObjectId}`);

            return ['SUCCESS', `Successfully deleted the group ${groupId} from the object ${groupObjectId}`];
        }
        else if (deleteApplicationAssociatedToGroupResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.deleteApplicationAssociatedToGroup: ERROR: Failed to delete the group ${groupId} from the object ${groupObjectId}. Error is ${deleteApplicationAssociatedToGroupResult[1]}`);
            return ['ERROR', `Failed to delete the group ${groupId} from the object ${groupObjectId}. Error is ${deleteApplicationAssociatedToGroupResult[1]}`];
        }
    },

    deleteAdminConsent: async (xid, azureToken, azureConfig, roleNameRemove, existingAppRoles, servicePrincipleId, existingGroups) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.deleteAdminConsent: Calling the azure service to delete admin consent of application roles");

        //* Delete the admin consent for the application roles
        let deletedAdminConsentRoles = [];
        let failedAdminConsentDeletionRoles = []
        existingGroups = existingGroups[1].value;
        for (let existingAppRole of existingAppRoles) {

            for (let existingGroup of existingGroups) {

                if ((existingAppRole.id == existingGroup.appRoleId) && (existingAppRole.displayName == roleNameRemove)) {

                    //* Remove admin consent
                    let removeAdminConsentResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${servicePrincipleId}/appRoleAssignedTo/${existingGroup.id}`, 'DELETE', null, 'json');
                    if (removeAdminConsentResult[0] === 'SUCCESS') {
                        sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.deleteAdminConsent: Successfully delete the admin consent for role ${existingGroup.id} from application service principle ${servicePrincipleId}`);
                        deletedAdminConsentRoles.push(existingGroup.id);
                    }
                    else if (removeAdminConsentResult[0] === 'ERROR') {
                        sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.deleteAdminConsent: ERROR: Failed to delete the admin consent for role ${existingGroup.id} from application service principle ${servicePrincipleId}. Error is ${removeAdminConsentResult[1]}`);
                        failedAdminConsentDeletionRoles.push(existingGroup.id);
                        return ['ERROR', `Failed to delete the admin consent for role ${existingGroup.id} from application service principle ${servicePrincipleId}. Error is ${removeAdminConsentResult[1]}`];
                    }
                }

            }

        }

        return ["SUCCESS", `The admin consents has been removed for the role ids ${deletedAdminConsentRoles}`];

    },

    addAdminConsentForConsumerRoles: async (xid, azureToken, azureConfig, postBody, consumerServiceId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addAdminConsentForConsumerRoles: Calling the azure service to add admin consent for consumer roles");
        let adminConsentForConsumerRoleResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${consumerServiceId}/appRoleAssignments/`, 'POST', postBody, 'json');
        if (adminConsentForConsumerRoleResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addAdminConsentForConsumerRoles: Successfully added admin consent for role ${postBody.resourceDisplayName}`);
            return ['SUCCESS', `Successfully added admin consent for role ${postBody.resourceDisplayName}`];
        }
        else if (adminConsentForConsumerRoleResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addAdminConsentForConsumerRoles: ERROR: Failed to add admin consent for role ${postBody.resourceDisplayName}. Error is ${adminConsentForConsumerRoleResult[1]}`);
            return ['ERROR', `Failed to add admin consent for role ${postBody.resourceDisplayName}. Error is ${adminConsentForConsumerRoleResult[1]}`];
        }
    },


    addAdminConsentForRoles: async (xid, azureToken, azureConfig, serviceId, appRolesList, azureRegisteredAppName, existingGroups) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addAdminConsentForRoles: Calling the azure service to add admin consent for roles");
        let existingAppRoleId = false;
        let postBody;

        for (let appRole of appRolesList) {

            //* Check if its existing role
            for (let existingGroup of existingGroups) {

                if (existingGroup.appRoleId === appRole.id) {
                    existingAppRoleId = true;
                }
            }

            if (!existingAppRoleId) {

                postBody =
                {
                    "appRoleId": `${appRole.id}`,
                    "principalDisplayName": `${azureRegisteredAppName}`,
                    "principalId": `${serviceId}`,
                    "principalType": "ServicePrincipal",
                    "resourceDisplayName": `${azureRegisteredAppName}`,
                    "resourceId": `${serviceId}`
                }

                let addAdminConsentResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${serviceId}/appRoleAssignments/`, 'POST', postBody, 'json');
                if (addAdminConsentResult[0] === 'SUCCESS') {
                    sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addAdminConsentForRoles: Successfully added admin consent for role id ${appRole.id} of application ${azureRegisteredAppName}.`);
                    
                }
                else if (addAdminConsentResult[0] === 'ERROR') {
                    sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addAdminConsentForRoles: ERROR: Failed to add admin consent for role id ${appRole.id} of application ${azureRegisteredAppName}. Error is ${addAdminConsentResult[1]}`);
                    return ["ERROR", `Failed to add admin consent for role id ${appRole.id}. Error is ${addAdminConsentResult[1]}`];
                }
            }
        }

        return ["SUCCESS", `Successfully added admin consent for app roles of application ${azureRegisteredAppName}`];

    },

    updateAppRoleAssignment: async (xid, azureToken, azureConfig, servicePrincipleId, appRoleAssignmentRequired) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.updateAppRoleAssignment: Calling the azure service to set app role assignment to reflect the groups");
        let postBody = {
            "appRoleAssignmentRequired": appRoleAssignmentRequired
        }

        let updateAppRoleAssignmentResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${servicePrincipleId}`, 'PATCH', postBody, 'json');
        if (updateAppRoleAssignmentResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.updateAppRoleAssignment: Successfully updated the app role assignment for service principle ${servicePrincipleId}`);
            return ["SUCCESS", `Successfully updated the app role assignment for service principle ${servicePrincipleId}`];

        }
        else if (updateAppRoleAssignmentResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.updateAppRoleAssignment: ERROR: Failed to update app role assignment for service principle ${servicePrincipleId}. Error is ${updateAppRoleAssignmentResult[1]}`);
            return ['ERROR', `Failed to update app role assignment for service principle ${servicePrincipleId}. Error is ${updateAppRoleAssignmentResult[1]}`];
        }


    },

    updateScopeValue: async (xid, azureToken, azureConfig, azureId, postBody) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.updateScopeValue: Calling the azure service to update scopes");

        let scopeUpdateResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.azureApi}/${azureId}`, 'PATCH', postBody, 'json');
        if (scopeUpdateResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.updateScopeValue: Successfully updated the scope of application ${azureId}`);
            return ['SUCCESS', `Successfully updated the scope of application ${azureId}`];
        }
        else if (scopeUpdateResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.updateScopeValue: ERROR: Failed to update scope of application ${azureId}. Error is ${scopeUpdateResult[1]}`);
            return ['ERROR', `Failed to update scope of application ${azureId}. Error is ${scopeUpdateResult[1]}`];

        }

    },

    addScope: async (xid, azureToken, azureConfig, rolesToAdd, azureId, azureRegisteredAppName, nononceScope,  apimAppId, Type, Action, org) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.addScope: Calling the azure service to add the scope for azure application");

        try {
            let roleNames = [];

            //* Split the comma separated roles and remove spaces
            if (rolesToAdd != "" && rolesToAdd != null && rolesToAdd != undefined) {
                roleNames = rolesToAdd.toString().split(",").map(item => item.trim());
            }
            else {
                return ['SUCCESS', `The provided role is empty or null. Nothing to add`];
            }

            //* Get manifest file for azure application
            let manifestFileResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
            if (manifestFileResult[0] === 'SUCCESS') {

                //* Store azure client id, scopes and roles
                let azureClientId = manifestFileResult[1].appId;
                let existingScopes = manifestFileResult[1].api.oauth2PermissionScopes;
                let existingRoles = manifestFileResult[1].appRoles;
                let existingGroups;

                //* Get service principle details
                let servicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, azureClientId);
                if (servicePrincipleResult[0] === 'SUCCESS') {

                    //* Store service principle id and appRoleAssignmentRequried details
                    let servicePrincipleId = servicePrincipleResult[1].value[0].id;
                    let appRoleAssignmentRequired = servicePrincipleResult[1].value[0].appRoleAssignmentRequired;

                    //* Get the existing Groups of application
                    let applicationAssociatedGroupsResult = await module.exports.getApplicationAssociatedGroups(xid, azureToken, azureConfig, servicePrincipleId);
                    if (applicationAssociatedGroupsResult[0] === 'SUCCESS') {
                        existingGroups = applicationAssociatedGroupsResult[1].value;

                        //* Process the new roles
                        let roleNamesOriginal = roleNames;

                        //* Check and add the groups
                        for (let roleName of roleNamesOriginal) {

                            let isGroupExists = false;

                            //* Check if role group already exists
                            for (let existingGroup of existingGroups) {

                                if (existingGroup.principalDisplayName === roleName) {
                                    isGroupExists = true;
                                }
                            }

                            if (!isGroupExists) {

                                //* Get the group information for new role
                                let groupDetailsResult = await module.exports.getAzureGroupDetails(xid, azureToken, azureConfig, roleName);
                                if (groupDetailsResult[0] === 'SUCCESS') {

                                    //* Store group object id
                                    let groupObjectId = groupDetailsResult[1].value[0].id;

                                    //* Add group to application
                                    let addApplicationToGroupResult = await module.exports.addApplicationToGroup(xid, azureToken, azureConfig, azureRegisteredAppName, servicePrincipleId, roleName, groupObjectId);
                                    if (addApplicationToGroupResult[0] === 'SUCCESS') {

                                        //* Successfully added application to group
                                    }
                                    else if (addApplicationToGroupResult[0] === 'ERROR') {
                                        return addApplicationToGroupResult;
                                    }
                                }
                                else if (groupDetailsResult[0] === 'ERROR') {

                                    //* Remove the role from list for which retreival of group details failed
                                    roleNames = _.without(roleNames, roleName);

                                    let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, roleName, Type, Action, org, 'error', "Role not found in azure, unable to add scope to the application");

                                }
                            }

                        }

                        //* Generate the scope and role structure and add it to azure application
                        let scopes = existingScopes;
                        let roles = existingRoles;

                        //* Check if existing scope is empty and add nononce
                        if (existingScopes.length === 0) {
                            nononceScope.id = `${uuidv4()}`;
                            scopes.push(nononceScope);
                        }

                        //* Check if new roles exists already and add if not
                        for (let roleName of roleNames) {

                            let isScopeExists = false;

                            //* Check if role/scope exists
                            for (let existingScope of existingScopes) {
                                let scopeDisplayName = existingScope.adminConsentDisplayName;

                                if (scopeDisplayName === roleName) {
                                    isScopeExists = true;
                                }

                            }

                            //* If scope doesn't exists add both scope and role structure
                            if (!isScopeExists) {

                                let dynamicId = `${uuidv4()}`;

                                //* Add Scope
                                scope = {
                                    "adminConsentDescription": "Roles required to access specific APIs",
                                    "adminConsentDisplayName": `${roleName}`,
                                    "id": `${dynamicId}`,
                                    "isEnabled": true,
                                    "type": "Admin",
                                    "userConsentDescription": "Roles required to access specific APIs",
                                    "userConsentDisplayName": `${roleName}`,
                                    "value": `${roleName}`
                                }
                                scopes.push(scope);

                                //* Add Role
                                role = {
                                    "allowedMemberTypes": [
                                        "Application"
                                    ],
                                    "description": "Roles required to access specific APIs",
                                    "displayName": `${roleName}`,
                                    "id": `${dynamicId}`,
                                    "isEnabled": true,
                                    "origin": "Application",
                                    "value": `${roleName}`

                                }

                                roles.push(role);
                            }
                        }

                        //* Add the scope/roles to application
                        let body = {
                            "identifierUris": [`api://${azureClientId}`],
                            "api": {
                                "oauth2PermissionScopes": scopes

                            },
                            "appRoles": roles
                        }

                        let addScopeResult = await module.exports.updateScopeValue(xid, azureToken, azureConfig, azureId, body);

                        if (addScopeResult[0] === 'SUCCESS') {

                            //* Get the manifest file after the scope addition
                            let manifestAfterScopeAddResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                            if (manifestAfterScopeAddResult[0] === 'SUCCESS') {

                                //* Store the roles
                                let rolesAfterUpdate = manifestAfterScopeAddResult[1].appRoles;

                                //* Add admin consent for added roles
                                let addAdminConsentResult = await module.exports.addAdminConsentForRoles(xid, azureToken, azureConfig, servicePrincipleId, rolesAfterUpdate, azureRegisteredAppName, existingGroups);
                                if (addAdminConsentResult[0] === 'SUCCESS') {

                                    //* Check and update the appRoleAssignmentRequried field
                                    if (!appRoleAssignmentRequired) {
                                        //change here
                                        let updateAppRoleAssignmentResult = await module.exports.updateAppRoleAssignment(xid, azureToken, azureConfig, servicePrincipleId, true);

                                        if (updateAppRoleAssignmentResult[0] === 'SUCCESS') {

                                            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addScope: Successfully added scopes for azure application ${azureRegisteredAppName}`);
                                            return ['SUCCESS', `Successfully added scopes for azure application ${azureRegisteredAppName}`];
                                        }
                                        else if (updateAppRoleAssignmentResult[0] === 'ERROR') {
                                            return updateAppRoleAssignmentResult;
                                        }
                                    }
                                    //prajwal added this
                                    else if(appRoleAssignmentRequired){
                                        sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addScope: App role assignment is already enabled for azure application ${azureRegisteredAppName}`);
                                        sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addScope: Successfully added scopes for azure application ${azureRegisteredAppName}`);
                                        return ['SUCCESS', `Successfully added scopes for azure application ${azureRegisteredAppName}`];
                                    }
                                }
                                else if (addAdminConsentResult[0] === 'ERROR') {
                                    return addAdminConsentResult;
                                }
                            }
                            else if (manifestAfterScopeAddResult[0] === 'ERROR') {
                                return manifestAfterScopeAddResult;
                            }
                        }
                        else if (addScopeResult[0] === 'ERROR') {
                            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addScope: ERROR: Failed to add the scopes for azure application ${azureRegisteredAppName}. Error is ${addScopeResult[1]}`);
                            return addScopeResult;
                        }

                    }
                    else if (applicationAssociatedGroupsResult[0] === 'ERROR') {
                        return applicationAssociatedGroupsResult;
                    }
                }
                else if (servicePrincipleResult[0] === 'ERROR') {
                    return servicePrincipleResult;
                }
            }
            else if (manifestFileResult[0] === 'ERROR') {
                return manifestFileResult;
            }
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addScope: ERROR: Failed to add scope for application ${azureRegisteredAppName}. Error is ${error}`);
            return ['ERROR', `Failed to add scope for application ${azureRegisteredAppName}. Error is ${error}`];
        }
    },

    removeScope: async (xid, azureToken, azureConfig, rolesToRemove, azureId, azureRegisteredAppName) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.removeScope: Calling the azure service to remove the scopes/roles from azure application");

        try {
            let roleNames = [];

            //* Split the comma separated roles and remove spaces
            if (rolesToRemove != "" && rolesToRemove != null && rolesToRemove != undefined) {
                roleNames = rolesToRemove.toString().split(",").map(item => item.trim());
            }
            else {
                return ['SUCCESS', `The provided role is empty or null. Nothing to remove.`];
            }

            //* Get manifest file for azure application
            let manifestFileResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
            if (manifestFileResult[0] === 'SUCCESS') {

                //* Store azure client id, scopes and roles
                let azureClientId = manifestFileResult[1].appId;
                let existingScopes = manifestFileResult[1].api.oauth2PermissionScopes;
                let existingRoles = manifestFileResult[1].appRoles;
                let existingGroups;

                //* Get service principle details
                let servicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, azureClientId);
                if (servicePrincipleResult[0] === 'SUCCESS') {

                    //* Store service principle id and appRoleAssignmentRequried details
                    let servicePrincipleId = servicePrincipleResult[1].value[0].id;
                    let appRoleAssignmentRequired = servicePrincipleResult[1].value[0].appRoleAssignmentRequired;

                    //* Get the existing Groups of application
                    let applicationAssociatedGroupsResult = await module.exports.getApplicationAssociatedGroups(xid, azureToken, azureConfig, servicePrincipleId);
                    if (applicationAssociatedGroupsResult[0] === 'SUCCESS') {
                        existingGroups = applicationAssociatedGroupsResult[1].value;

                        //* Process the new roles
                        let roleNamesOriginal = roleNames;

                        //* Check and delete the groups
                        for (let roleName of roleNamesOriginal) {

                            let isGroupExists = false;
                            let groupObjectId;
                            let groupId;

                            //* Check if role group already exists
                            for (let existingGroup of existingGroups) {

                                if (existingGroup.principalDisplayName === roleName && existingGroup.principalType === 'Group') {
                                    isGroupExists = true;
                                    groupObjectId = existingGroup.principalId;
                                    groupId = existingGroup.id;
                                    break;
                                }
                            }

                            if (isGroupExists) {

                                //* Delete the group from application

                                let deleteApplicationFromGroupResult = await module.exports.deleteApplicationAssociatedToGroup(xid, azureToken, azureConfig, groupObjectId, groupId);
                                if (deleteApplicationFromGroupResult[0] === 'SUCCESS') {

                                    //* successfully deleted the application associated to group

                                }
                                else if (deleteApplicationFromGroupResult[0] === 'ERROR') {
                                    return deleteApplicationFromGroupResult;
                                }

                            }

                        }

                        //* Generate the scope and role structure and add it to azure application
                        let scopes = [];
                        let roles = [];

                        //* Check if scopes exists and disable it
                        for (let existingScope of existingScopes) {

                            let scopeDisplayName = existingScope.adminConsentDisplayName;
                            let scopeExists = roleNames.filter(roleName => roleName == scopeDisplayName);
                            if (scopeExists.length == 0) {
                                scopes.push(existingScope);
                            }
                            else if (scopeExists.length == 1) {
                                existingScope.isEnabled = false;
                                scopes.push(existingScope);
                            }
                        }

                        //* Check if roles exists and disable it
                        for (let existingRole of existingRoles) {

                            let roleDisplayName = existingRole.displayName;
                            let roleExists = roleNames.filter(roleName => roleName == roleDisplayName);
                            if (roleExists.length == 0) {
                                roles.push(existingRole);
                            }
                            else if (roleExists.length == 1) {
                                existingRole.isEnabled = false;
                                roles.push(existingRole);
                            }
                        }

                        //* Update the scope/roles to get disabled from application
                        let body = {
                            "identifierUris": [`api://${azureClientId}`],
                            "api": {
                                "oauth2PermissionScopes": scopes

                            },
                            "appRoles": roles
                        }

                        let disableScopeResult = await module.exports.updateScopeValue(xid, azureToken, azureConfig, azureId, body);

                        if (disableScopeResult[0] === 'SUCCESS') {

                            //* Get the manifest file after disabling scope/role
                            let manifestAfterScopeDisableResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                            if (manifestAfterScopeDisableResult[0] === 'SUCCESS') {

                                //* Store the roles and scopes
                                let updatedRolesAfterDisable = manifestAfterScopeDisableResult[1].appRoles;
                                let updatedScopesAfterDisable = manifestAfterScopeDisableResult[1].api.oauth2PermissionScopes;

                                let scopesToBeRemoved = [];
                                let rolesToBeRemoved = [];

                                //* Remove the roles that are disabled
                                for (let updatedRoleAfterDisable of updatedRolesAfterDisable) {
                                    if (updatedRoleAfterDisable.isEnabled === true) {
                                        rolesToBeRemoved.push(updatedRoleAfterDisable);
                                    }
                                }

                                //* Remove the scopes that are disabled
                                for (let updatedScopeAfterDisable of updatedScopesAfterDisable) {
                                    if (updatedScopeAfterDisable.isEnabled === true) {
                                        scopesToBeRemoved.push(updatedScopeAfterDisable);
                                    }
                                }

                                //* Update the scopes/roles after removal

                                let removalScopeBody = {
                                    "identifierUris": [`api://${azureClientId}`],
                                    "api": {
                                        "oauth2PermissionScopes": scopesToBeRemoved

                                    },
                                    "appRoles": rolesToBeRemoved
                                }

                                let removedScopeResult = await module.exports.updateScopeValue(xid, azureToken, azureConfig, azureId, removalScopeBody);
                                if (removedScopeResult[0] === 'SUCCESS') {

                                    //* Get manifest after scope removal
                                    let manifestAfterScopeRemovalResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                                    if (manifestAfterScopeRemovalResult[0] === 'SUCCESS') {

                                        //* Store the roles and scopes
                                        let updatedRolesAfterRemoval = manifestAfterScopeRemovalResult[1].appRoles;
                                        let updatedScopesAfterRemoval = manifestAfterScopeRemovalResult[1].api.oauth2PermissionScopes;

                                        //* Check if roles are empty and update the appRoleAssignmentRequired
                                        if (updatedRolesAfterRemoval.length == 0) {

                                            let updateAppRoleAssignmentResult = await module.exports.updateAppRoleAssignment(xid, azureToken, azureConfig, servicePrincipleId, false);
                                            if (updateAppRoleAssignmentResult[0] === 'SUCCESS') {

                                                sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.removeScope: Successfully removed scopes from azure application ${azureRegisteredAppName}`);
                                                return ['SUCCESS', `Successfully removed scopes from azure application ${azureRegisteredAppName}`];
                                            }
                                            else if (updateAppRoleAssignmentResult[0] === 'ERROR') {
                                                return updateAppRoleAssignmentResult;
                                            }
                                        }
                                        else {
                                            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.removeScope: Successfully removed scopes from azure application ${azureRegisteredAppName}`);
                                            return ['SUCCESS', `Successfully removed scopes from azure application ${azureRegisteredAppName}`];
                                        }

                                    }
                                    else if (manifestAfterScopeRemovalResult[0] === 'ERROR') {
                                        return manifestAfterScopeRemovalResult;
                                    }
                                }
                                else if (removedScopeResult[0] === 'ERROR') {
                                    sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeScope: ERROR: Failed to remove the scopes/roles from azure application ${azureRegisteredAppName}. Error is ${removedScopeResult[1]}`);
                                    return removedScopeResult;
                                }

                            }
                            else if (manifestAfterScopeDisableResult[0] === 'ERROR') {
                                return manifestAfterScopeDisableResult;
                            }
                        }
                        else if (disableScopeResult[0] === 'ERROR') {
                            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeScope: ERROR: Failed to disable the scopes/roles from azure application ${azureRegisteredAppName}. Error is ${disableScopeResult[1]}`);
                            return disableScopeResult;
                        }

                    }
                    else if (applicationAssociatedGroupsResult[0] === 'ERROR') {
                        return applicationAssociatedGroupsResult;
                    }
                }
                else if (servicePrincipleResult[0] === 'ERROR') {
                    return servicePrincipleResult;
                }
            }
            else if (manifestFileResult[0] === 'ERROR') {
                return manifestFileResult;
            }
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeScope: ERROR: Failed to remove scope/roles from application ${azureRegisteredAppName}. Error is ${error}`);
            return ['ERROR', `Failed to remove scope/roles from application ${azureRegisteredAppName}. Error is ${error}`];
        }
    },

    addResourceScope: async (xid, azureToken, azureConfig, rolesToAdd, azureId, azureRegisteredAppName, nononceScope, apimAppId, Type, Action, org) => {

        try {
            let roleNames = [];

            //* Extract roles from resource provider
            if (rolesToAdd != undefined && rolesToAdd != null && rolesToAdd != "") {
                let resourceScopes = rolesToAdd.toString().split(',').map(item => item.trim());
                for (const scope of resourceScopes) {
                    roleNames.push(scope.split('/')[3]);
                }
            }

            //* Get manifest file for azure application
            let manifestFileResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
            if (manifestFileResult[0] === 'SUCCESS') {

                //* Store azure client id, scopes and roles
                let azureClientId = manifestFileResult[1].appId;
                let existingScopes = manifestFileResult[1].api.oauth2PermissionScopes;
                let existingGroups;

                //* Get service principle details
                let servicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, azureClientId);
                if (servicePrincipleResult[0] === 'SUCCESS') {

                    //* Store service principle id and appRoleAssignmentRequried details
                    let servicePrincipleId = servicePrincipleResult[1].value[0].id;
                    let appRoleAssignmentRequired = servicePrincipleResult[1].value[0].appRoleAssignmentRequired;//try to make it true

                    //* Get the existing Groups of application
                    let applicationAssociatedGroupsResult = await module.exports.getApplicationAssociatedGroups(xid, azureToken, azureConfig, servicePrincipleId);
                    if (applicationAssociatedGroupsResult[0] === 'SUCCESS') {
                        existingGroups = applicationAssociatedGroupsResult[1].value;

                        //* Process the new roles
                        let roleNamesOriginal = roleNames;

                        //* Check and add the groups
                        for (let roleName of roleNamesOriginal) {

                            let isGroupExists = false;

                            //* Check if role group already exists
                            for (let existingGroup of existingGroups) {

                                if (existingGroup.principalDisplayName === roleName) {
                                    isGroupExists = true;
                                }
                            }

                            if (!isGroupExists) {

                                //* Get the group information for new role
                                let groupDetailsResult = await module.exports.getAzureGroupDetails(xid, azureToken, azureConfig, roleName);
                                if (groupDetailsResult[0] === 'SUCCESS') {

                                    //* Store group object id
                                    let groupObjectId = groupDetailsResult[1].value[0].id;

                                    //* Add group to application
                                    let addApplicationToGroupResult = await module.exports.addApplicationToGroup(xid, azureToken, azureConfig, azureRegisteredAppName, servicePrincipleId, roleName, groupObjectId);
                                    if (addApplicationToGroupResult[0] === 'SUCCESS') {

                                        //* Successfully added application to group
                                    }
                                    else if (addApplicationToGroupResult[0] === 'ERROR') {
                                        return addApplicationToGroupResult;
                                    }
                                }
                                else if (groupDetailsResult[0] === 'ERROR') {

                                    //* Remove the role from list for which retreival of group details failed
                                    roleNames = _.without(roleNames, roleName);
                                    //update the azure logs
                                    let addAzureLogResult = await logServices.azureLogs(xid, apimAppId, roleName, Type, Action, org, 'error', "Role not found in azure, unable to add scope to the application");

                                }
                            }

                        }

                        //* Generate the scope structure and add it to azure application
                        let scopes = existingScopes;

                        //* Check if existing scope is empty and add nononce
                        if (existingScopes.length === 0) {
                            nononceScope.id = `${uuidv4()}`;
                            scopes.push(nononceScope);
                        }

                        //* Check if new roles exists already and add if not
                        for (let roleName of roleNames) {

                            let isScopeExists = false;

                            //* Check if role/scope exists
                            for (let existingScope of existingScopes) {
                                let scopeDisplayName = existingScope.adminConsentDisplayName;

                                if (scopeDisplayName === roleName) {
                                    isScopeExists = true;
                                }

                            }

                            //* If scope doesn't exists add both scope and role structure
                            if (!isScopeExists) {

                                let dynamicId = `${uuidv4()}`;

                                //* Add Scope
                                scope = {
                                    "adminConsentDescription": "Roles required to access specific APIs",
                                    "adminConsentDisplayName": `${roleName}`,
                                    "id": `${dynamicId}`,
                                    "isEnabled": true,
                                    "type": "Admin",
                                    "userConsentDescription": "Roles required to access specific APIs",
                                    "userConsentDisplayName": `${roleName}`,
                                    "value": `${roleName}`
                                }
                                scopes.push(scope);
                            }
                        }

                        //* Add the scope/roles to application
                        let body = {
                            "identifierUris": [`api://${azureClientId}`],
                            "api": {
                                "oauth2PermissionScopes": scopes

                            }
                        }

                        let addScopeResult = await module.exports.updateScopeValue(xid, azureToken, azureConfig, azureId, body);

                        if (addScopeResult[0] === 'SUCCESS') {

                            //* Check and update the appRoleAssignmentRequried field
                            if (!appRoleAssignmentRequired) {
                                //change here
                                let updateAppRoleAssignmentResult = await module.exports.updateAppRoleAssignment(xid, azureToken, azureConfig, servicePrincipleId, true);
                                if (updateAppRoleAssignmentResult[0] === 'SUCCESS') {

                                    sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addResourceScope: Successfully added resource scopes for azure application ${azureRegisteredAppName}`);
                                    return ['SUCCESS', `Successfully added resource scopes for azure application ${azureRegisteredAppName}`];
                                }
                                else if (updateAppRoleAssignmentResult[0] === 'ERROR') {
                                    return updateAppRoleAssignmentResult;
                                }
                            }
                            //prajwal added this
                            else if(appRoleAssignmentRequired){
                                sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addScope: App role assignment is already enabled for azure application ${azureRegisteredAppName}`);
                                sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addScope: Successfully added scopes for azure application ${azureRegisteredAppName}`);
                                return ['SUCCESS', `Successfully added resource scopes for azure application ${azureRegisteredAppName}`];
                            }
                        }
                        else if (addScopeResult[0] === 'ERROR') {
                            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addResourceScope: ERROR: Failed to add the resource scopes for azure application ${azureRegisteredAppName}. Error is ${addScopeResult[1]}`);
                            return addScopeResult;
                        }

                    }
                    else if (applicationAssociatedGroupsResult[0] === 'ERROR') {
                        return applicationAssociatedGroupsResult;
                    }

                }
                else if (servicePrincipleResult[0] === 'ERROR') {
                    return servicePrincipleResult;
                }

            }
            else if (manifestFileResult[0] === 'ERROR') {
                return manifestFileResult;
            }
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addResourceScope: ERROR: Failed to add resource scope from application ${azureRegisteredAppName}. Error is ${error}`);
            return ['ERROR', `Failed to add resource scope from application ${azureRegisteredAppName}. Error is ${error}`];
        }
    },

    removeResourceScope: async (xid, azureToken, azureConfig, rolesToRemove, azureId, azureRegisteredAppName) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.removeResourceScope: Calling the azure service to remove the resource scopes/roles from azure application");

        try {

            let roleNames = [];

            //* Split the comma separated roles and remove spaces. Extact the roles from resource provider string
            if (rolesToRemove != "" && rolesToRemove != null && rolesToRemove != undefined) {
                let resourceScopes = rolesToRemove.toString().split(',').map(item => item.trim());
                for (const scope of resourceScopes) {
                    roleNames.push(scope.split('/')[3]);
                }
            }
            else {
                return ['SUCCESS', `The provided role is empty or null. Nothing to remove.`];
            }

            //* Get manifest file for azure application
            let manifestFileResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
            if (manifestFileResult[0] === 'SUCCESS') {

                //* Store azure client id, scopes and roles
                let azureClientId = manifestFileResult[1].appId;
                let existingScopes = manifestFileResult[1].api.oauth2PermissionScopes;
                let existingGroups;

                //* Get service principle details
                let servicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, azureClientId);
                if (servicePrincipleResult[0] === 'SUCCESS') {

                    //* Store service principle id and appRoleAssignmentRequried details
                    let servicePrincipleId = servicePrincipleResult[1].value[0].id;
                    let appRoleAssignmentRequired = servicePrincipleResult[1].value[0].appRoleAssignmentRequired;

                    //* Get the existing Groups of application
                    let applicationAssociatedGroupsResult = await module.exports.getApplicationAssociatedGroups(xid, azureToken, azureConfig, servicePrincipleId);
                    if (applicationAssociatedGroupsResult[0] === 'SUCCESS') {
                        existingGroups = applicationAssociatedGroupsResult[1].value;

                        //* Process the new roles
                        let roleNamesOriginal = roleNames;

                        //* Check and delete the groups
                        for (let roleName of roleNamesOriginal) {

                            let isGroupExists = false;
                            let groupObjectId;
                            let groupId;

                            //* Check if role group already exists
                            for (let existingGroup of existingGroups) {

                                if (existingGroup.principalDisplayName === roleName && existingGroup.principalType === 'Group') {
                                    isGroupExists = true;
                                    groupObjectId = existingGroup.principalId;
                                    groupId = existingGroup.id;
                                    break;
                                }
                            }

                            if (isGroupExists) {

                                //* Delete the group from application

                                let deleteApplicationFromGroupResult = await module.exports.deleteApplicationAssociatedToGroup(xid, azureToken, azureConfig, groupObjectId, groupId);
                                if (deleteApplicationFromGroupResult[0] === 'SUCCESS') {

                                    //* successfully deleted the application associated to group

                                }
                                else if (deleteApplicationFromGroupResult[0] === 'ERROR') {
                                    return deleteApplicationFromGroupResult;
                                }

                            }

                        }

                        //* Generate the scope and role structure and add it to azure application
                        let scopes = [];

                        //* Check if scopes exists and disable it
                        for (let existingScope of existingScopes) {

                            let scopeDisplayName = existingScope.adminConsentDisplayName;
                            let scopeExists = roleNames.filter(roleName => roleName == scopeDisplayName);
                            if (scopeExists.length == 0) {
                                scopes.push(existingScope);
                            }
                            else if (scopeExists.length == 1) {
                                existingScope.isEnabled = false;
                                scopes.push(existingScope);
                            }
                        }

                        //* Update the resource scope/roles to get disabled from application
                        let body = {
                            "identifierUris": [`api://${azureClientId}`],
                            "api": {
                                "oauth2PermissionScopes": scopes

                            }
                        }

                        let disableScopeResult = await module.exports.updateScopeValue(xid, azureToken, azureConfig, azureId, body);
                        if (disableScopeResult[0] === 'SUCCESS') {

                            //* Get the manifest file after disabling scope
                            let manifestAfterScopeDisableResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                            if (manifestAfterScopeDisableResult[0] === 'SUCCESS') {

                                //* Store the scopes
                                let updatedScopesAfterDisable = manifestAfterScopeDisableResult[1].api.oauth2PermissionScopes;

                                let scopesToBeRemoved = [];

                                //* Remove the scopes that are disabled
                                for (let updatedScopeAfterDisable of updatedScopesAfterDisable) {
                                    if (updatedScopeAfterDisable.isEnabled === true) {
                                        scopesToBeRemoved.push(updatedScopeAfterDisable);
                                    }
                                }

                                //* Update the scopes/roles after removal

                                let removalScopeBody = {
                                    "identifierUris": [`api://${azureClientId}`],
                                    "api": {
                                        "oauth2PermissionScopes": scopesToBeRemoved

                                    }
                                }

                                let removedScopeResult = await module.exports.updateScopeValue(xid, azureToken, azureConfig, azureId, removalScopeBody);
                                if (removedScopeResult[0] === 'SUCCESS') {

                                    //* Get manifest after scope removal
                                    let manifestAfterScopeRemovalResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                                    if (manifestAfterScopeRemovalResult[0] === 'SUCCESS') {

                                        //* Store the scopes
                                        let updatedScopesAfterRemoval = manifestAfterScopeRemovalResult[1].api.oauth2PermissionScopes;

                                        //* Check if scopes are empty and update the appRoleAssignmentRequired
                                        if ((updatedScopesAfterRemoval.length === 1) && (updatedScopesAfterRemoval[0].value === "nononce")) {

                                            let updateAppRoleAssignmentResult = await module.exports.updateAppRoleAssignment(xid, azureToken, azureConfig, servicePrincipleId, false);
                                            if (updateAppRoleAssignmentResult[0] === 'SUCCESS') {

                                                sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.removeResourceScope: Successfully removed resource scopes from azure application ${azureRegisteredAppName}`);
                                                return ['SUCCESS', `Successfully removed resource scopes from azure application ${azureRegisteredAppName}`];
                                            }
                                            else if (updateAppRoleAssignmentResult[0] === 'ERROR') {
                                                return updateAppRoleAssignmentResult;
                                            }
                                        }
                                        else {
                                            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.removeResourceScope: Successfully removed resource scopes from azure application ${azureRegisteredAppName}`);
                                            return ['SUCCESS', `Successfully removed resource scopes from azure application ${azureRegisteredAppName}`];
                                        }

                                    }
                                    else if (manifestAfterScopeRemovalResult[0] === 'ERROR') {
                                        return manifestAfterScopeRemovalResult;
                                    }

                                }
                                else if (removedScopeResult[0] === 'ERROR') {
                                    sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeResourceScope: ERROR: Failed to remove the resource scopes from azure application ${azureRegisteredAppName}. Error is ${removedScopeResult[1]}`);
                                    return removedScopeResult;
                                }
                            }
                            else if (manifestAfterScopeDisableResult[0] === 'ERROR') {
                                return manifestAfterScopeDisableResult;
                            }
                        }
                        else if (disableScopeResult[0] === 'ERROR') {
                            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeResourceScope: ERROR: Failed to disable the resource scopes from azure application ${azureRegisteredAppName}. Error is ${disableScopeResult[1]}`);
                            return disableScopeResult;
                        }
                    }
                    else if (applicationAssociatedGroupsResult[0] === 'ERROR') {
                        return applicationAssociatedGroupsResult;
                    }
                }
                else if (servicePrincipleResult[0] === 'ERROR') {
                    return servicePrincipleResult;
                }
            }
            else if (manifestFileResult[0] === 'ERROR') {
                return manifestFileResult;
            }
        }
        catch (error) {

            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeResourceScope: ERROR: Failed to remove resource scope/roles from application ${azureRegisteredAppName}. Error is ${error}`);
            return ['ERROR', `Failed to remove resource scope/roles from application ${azureRegisteredAppName}. Error is ${error}`];
        }
    },

    addResourceRole: async (xid, azureToken, azureConfig, appId, rolesToAdd, azureId, azureRegisteredAppName) => {

        try {

            //* Default Resource ROle
            const requiredResourceAccess = [{"resourceAppId": "00000003-0000-0000-c000-000000000000","resourceAccess": [{"id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d","type": "Scope"}]}];

            //console.log('function entry entry - roles : ', rolesToAdd)
            //console.log('function entry entry - resource : ', requiredResourceAccess)

            let resourceRoles = [];
            let resourceProviders = [];
            let requiredResourceAccessDetails = requiredResourceAccess;
            if (rolesToAdd !== "" && rolesToAdd !== undefined && rolesToAdd !== null) {

                resourceRoles = rolesToAdd.toString().split(',').map(item => item.trim());
                
                //* Extract resource provider id and role
                for(let resourceRole of resourceRoles) {
                    let resourceProviderData = {
                        "resourceId": resourceRole.split('/')[2],
                        "resourceRole": resourceRole.split('/')[3]
                    }
                    resourceProviders.push(resourceProviderData);
                }

                //console.log('addResourceRole - resource providers : ', resourceProviders)
                //* Create hash map
                let resourceProvidersHashMap = _.groupBy(resourceProviders, o => o.resourceId);
                let resourceProvidersHashMapKeys = _.keys(resourceProvidersHashMap);

                //console.log('resourceProvidersHashMap :  ',resourceProvidersHashMap)
                //console.log('resourceProvidersHashMapKeys :  ',resourceProvidersHashMapKeys)
                //* Get manifest file for azure application
                let manifestFileResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                if (manifestFileResult[0] === 'SUCCESS') {

                    //* Store azure client id
                    let azureClientId = manifestFileResult[1].appId;
                    //get exisiting required resource access from the consumer azure application
                    let consumerAppRequiredResourceAccess = manifestFileResult[1].requiredResourceAccess;
                    //If the consumer app required resource is empty take intial required resource access provided by the controller else take existing required resource access details from the consumer application details
                    
                    requiredResourceAccessDetails=consumerAppRequiredResourceAccess.length>0?consumerAppRequiredResourceAccess:requiredResourceAccess;

                    
                    //console.log('AddResource role - required access details : ',requiredResourceAccessDetails.resourceAppId , requiredResourceAccessDetails.resourceAccess);
                    //* Get service principle details
                    let servicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, azureClientId);
                    if (servicePrincipleResult[0] === 'SUCCESS') {

                        //* Store service principle id
                        let servicePrincipleId = servicePrincipleResult[1].value[0].id;

                        //* Get admin consent associated with application
                        let adminConsentAssociatedToApplicationResult = await module.exports.getAdminConsentAssociatedToApplication(xid, azureToken, azureConfig, servicePrincipleId);
                        if (adminConsentAssociatedToApplicationResult[0] === 'SUCCESS') {

                            let appAdminConsents = adminConsentAssociatedToApplicationResult[1].value;
                            if (appAdminConsents.length > 0) {

                                // //* Remove admin consent
                                for (let appAdminConsent of appAdminConsents) {

                                    let removeAdminConsentResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${servicePrincipleId}/appRoleAssignedTo/${appAdminConsent.id}`, 'DELETE', null, 'json');
                                    if (removeAdminConsentResult[0] === 'SUCCESS') {
                                        sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: Successfully deleted the admin consent for role ${appAdminConsent.id} from application service principle ${servicePrincipleId}`);
                                    }
                                    else if (removeAdminConsentResult[0] === 'ERROR') {
                                        sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: ERROR: Failed to delete the admin consent for role ${appAdminConsent.id} from application service principle ${servicePrincipleId}. Error is ${removeAdminConsentResult[1]}`);
                                    }
                                }

                            }
                            
                            //* Get the resource role structure ready
                            const forLoop = async _ => {
                                for(let resourceProviderKey of resourceProvidersHashMapKeys) {

                                    let rolesTobeAdded = [];

                                    //* Get manifest details of resource provider app
                                    let resourceProviderAppManifestDetailsResult = await module.exports.getManifestFileWithClientId(xid, azureToken, azureConfig, resourceProviderKey, azureId);
                                    if(resourceProviderAppManifestDetailsResult[0] === 'SUCCESS') {

                                        if(resourceProviderAppManifestDetailsResult[1].value.length > 0) {

                                            //* Store the app roles
                                            let resourceProviderAppRoles = resourceProviderAppManifestDetailsResult[1].value[0].appRoles;

                                            //* Add all matched roles
                                            for(let resourceProviderValue of resourceProvidersHashMap[resourceProviderKey]) {
                                                for(let resourceProviderAppRole of resourceProviderAppRoles) {
                                                    ////console.log(resourceProviderAppRole.id)
                                                    if(resourceProviderValue.resourceRole === resourceProviderAppRole.displayName.trim()) {
                                                        let matchedRoles = {
                                                            "id": `${resourceProviderAppRole.id}`,
                                                            "type": "Role"
                                                        }
                                                        rolesTobeAdded.push(matchedRoles);
                                                    }
                                                    // else if(resourceProviderValue.resourceRole === resourceProviderAppRole.displayName.trim()&&isResourceIdPresent!==-1){

                                                    // }
                                                }
                                            }
                                            //prajwal modified here
                                            //Check if the current resource provider key already present in the consumer app
                                            //console.log("rolestobeAdded : ",rolesTobeAdded)

                                            const isResourceIdPresent = findIndex(requiredResourceAccessDetails, function (resourceApp) { return resourceApp.resourceAppId === resourceProviderKey; });
                                            //If resource provider key not present in the consumer application required resource access field
                                            if (isResourceIdPresent === -1) {
                                                let rolesData = {
                                                    "resourceAppId": `${resourceProviderKey}`,
                                                    "resourceAccess": rolesTobeAdded
                                                }
                                                requiredResourceAccessDetails.push(rolesData)

                                            }
                                            //If resource provider key already present in the consumer application required resource access field
                                            else if (isResourceIdPresent >=0) {
                                                let requiredResources=difference(rolesTobeAdded,requiredResourceAccessDetails[isResourceIdPresent].resourceAccess,isEqual);
                                                requiredResourceAccessDetails[isResourceIdPresent].resourceAccess = requiredResourceAccessDetails[isResourceIdPresent].resourceAccess.concat(requiredResources);
                                            }

                                        }
                                        else {
                                            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: No manifest data found for resource provider app id ${resourceProviderKey} for application ${azureRegisteredAppName}`);
                                        }
                                    }
                                    else if(resourceProviderAppManifestDetailsResult[0] === 'ERROR') {
                                        return resourceProviderAppManifestDetailsResult;
                                    }
                                }
                            }
                            
                            await forLoop();

                            let postBody = {
                                "requiredResourceAccess": requiredResourceAccessDetails
                            }

                            //console.log('post body :' , postBody)
                            let updateResourceRoleValueResult = await module.exports.updateResourceRoleValue(xid, azureToken, azureConfig, azureId, postBody);
                            if(updateResourceRoleValueResult[0] === 'SUCCESS') {

                                //* Get manifest file after updating the resource role
                                let manifestAfterResourceRoleUpdateResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                                if (manifestAfterResourceRoleUpdateResult[0] === 'SUCCESS') {

                                    //* Store required resource access
                                    let requiredResourceAccessAfterUpdate = manifestAfterResourceRoleUpdateResult[1].requiredResourceAccess;

                                    for(let resource of requiredResourceAccessAfterUpdate) {
                                        if (resource.resourceAppId != "00000003-0000-0000-c000-000000000000") {
                                        
                                            //* Get service principle data of resource provider app
                                            let resourceProviderAppServicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, resource.resourceAppId);
                                            if (resourceProviderAppServicePrincipleResult[0] === 'SUCCESS') {

                                                let resourceProviderAppServicePrincipleId = resourceProviderAppServicePrincipleResult[1].value[0].id;
                                                let resourceProviderAppDisplayName = resourceProviderAppServicePrincipleResult[1].value[0].appDisplayName;

                                                //* Add admin consent
                                                for(let appRoleAccess of resource.resourceAccess) {

                                                    let adminConsentPostBody = {
                                                        "appRoleId": `${appRoleAccess.id}`,
                                                        "principalDisplayName": `${azureRegisteredAppName}`,
                                                        "principalId": `${servicePrincipleId}`,
                                                        "principalType": "ServicePrincipal",
                                                        "resourceDisplayName": `${resourceProviderAppDisplayName}`,
                                                        "resourceId": `${resourceProviderAppServicePrincipleId}`
                                                    }

                                                    let addAdminConsentResult= await module.exports.addAdminConsentForConsumerRoles(xid, azureToken, azureConfig, adminConsentPostBody, servicePrincipleId);
                                                    if(addAdminConsentResult[0] === 'SUCCESS') {
                                                        //* Successfully added admin consent for role
                                                    }
                                                    else if(addAdminConsentResult[0] === 'ERROR') {
                                                        return addAdminConsentResult;
                                                    }
                                                }
                                            }
                                            else if(resourceProviderAppServicePrincipleResult[0] === 'ERROR') {
                                                return resourceProviderAppServicePrincipleResult;
                                            }
                                        }
                                    }

                                    sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: Successfully added resource roles to application ${azureRegisteredAppName}.`);
                                    return ['SUCCESS', `Successfully added resource roles to application ${azureRegisteredAppName}.`];
                                }
                                else if(manifestAfterResourceRoleUpdateResult[0] === 'ERROR') {
                                    return manifestAfterResourceRoleUpdateResult;
                                }
                            }
                            else if(updateResourceRoleValueResult[0] === 'ERROR') {
                                return updateResourceRoleValueResult;
                            }
                        }
                        else if (adminConsentAssociatedToApplicationResult[0] === 'ERROR') {
                            return adminConsentAssociatedToApplicationResult;
                        }
                    }
                    else if (servicePrincipleResult[0] === 'ERROR') {
                        return servicePrincipleResult;
                    }

                }
                else if (manifestFileResult[0] === 'ERROR') {
                    return manifestFileResult;
                }
            }
            else {
                return ['SUCCESS', `The provided resource role is empty or null. Nothing to add.`];
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: ERROR: Failed to add resource roles from application ${azureRegisteredAppName}. Error is ${error}`);
            return ['ERROR', `Failed to add resource roles from application ${azureRegisteredAppName}. Error is ${error}`];
        }
    },

    deleteAdminConsentForResourceRole: async (xid, azureToken, azureConfig, servicePrincipleId, resourceId) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": azureServices.deleteAdminConsentForResourceRole: Calling the azure service to delete admin consent of application resource roles");

        //* Remove admin consent
        let removeAdminConsentResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${servicePrincipleId}/appRoleAssignedTo/${resourceId}`, 'DELETE', null, 'json');
        if (removeAdminConsentResult[0] === 'SUCCESS') {
            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.deleteAdminConsentForResourceRole: Successfully delete the admin consent for role ${resourceId} from application service principle ${servicePrincipleId}`);
            return ["SUCCESS", `The admin consents has been removed for the role ${resourceId} from application service principle ${servicePrincipleId}`];
        }
        else if (removeAdminConsentResult[0] === 'ERROR') {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.deleteAdminConsentForResourceRole: ERROR: Failed to delete the admin consent for role ${resourceId} from application service principle ${servicePrincipleId}. Error is ${removeAdminConsentResult[1]}`);
            return ['ERROR', `Failed to delete the admin consent for role ${resourceId} from application service principle ${servicePrincipleId}. Error is ${removeAdminConsentResult[1]}`];
        }
               
    },

    removeResourceRole: async (xid, azureToken, azureConfig, rolesToRemove, azureId, azureRegisteredAppName) => {

        try {

            let resourceRoles = [];
            let resourceProviders = [];
            if (rolesToRemove !== "" && rolesToRemove !== undefined && rolesToRemove !== null) {

                resourceRoles = rolesToRemove.toString().split(',').map(item => item.trim());
                
                //* Extract resource provider id and role
                for(let resourceRole of resourceRoles) {
                    let resourceProviderData = {
                        "resourceId": resourceRole.split('/')[2],
                        "resourceRole": resourceRole.split('/')[3]
                    }
                    resourceProviders.push(resourceProviderData);
                }

                //* Create hash map
                let resourceProvidersHashMap = _.groupBy(resourceProviders, o => o.resourceId);
                let resourceProvidersHashMapKeys = _.keys(resourceProvidersHashMap);
                let adminConsentResourceProviderHashMap;
                let adminConsentResourceProviderHashMapKeys;//changed
                let removedAdminConsents = [];
                let removedAdminConsentResourceRoles = [];

                //* Get manifest file for azure application
                let manifestFileResult = await module.exports.getManifestFile(xid, azureToken, azureConfig, azureId);
                if (manifestFileResult[0] === 'SUCCESS') {

                    //* Store azure client id
                    let azureClientId = manifestFileResult[1].appId;
                    let requiredResourceAccess = manifestFileResult[1].requiredResourceAccess;

                    //* Get service principle details
                    let servicePrincipleResult = await module.exports.getServicePrincipleDetails(xid, azureToken, azureConfig, azureClientId);
                    if (servicePrincipleResult[0] === 'SUCCESS') {

                        //* Store service principle id
                        let servicePrincipleId = servicePrincipleResult[1].value[0].id;

                        //* Get admin consent associated with application
                        let adminConsentAssociatedToApplicationResult = await module.exports.getAdminConsentAssociatedToApplication(xid, azureToken, azureConfig, servicePrincipleId);
                        if (adminConsentAssociatedToApplicationResult[0] === 'SUCCESS') {

                            let appAdminConsents = adminConsentAssociatedToApplicationResult[1].value;
                            //console.log('log',appAdminConsents)
                            if (appAdminConsents.length > 0) {

                                //* Create Hash Map
                                adminConsentResourceProviderHashMap = _.groupBy(appAdminConsents, o => o.appRoleId);
                                //console.log(adminConsentResourceProviderHashMap)
                                adminConsentResourceProviderHashMapKeys = _.keys(adminConsentResourceProviderHashMap);

                                // //* Remove admin consent
                                // for (let appAdminConsent of appAdminConsents) {

                                //     let removeAdminConsentResult = await httpRequestServices.request(xid, azureToken, `${azureConfig.servicePrincipalApi}/${servicePrincipleId}/appRoleAssignedTo/${appAdminConsent.id}`, 'DELETE', null, 'json');
                                //     if (removeAdminConsentResult[0] === 'SUCCESS') {
                                //         sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: Successfully deleted the admin consent for role ${appAdminConsent.id} from application service principle ${servicePrincipleId}`);
                                //     }
                                //     else if (removeAdminConsentResult[0] === 'ERROR') {
                                //         sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.addResourceRole: ERROR: Failed to delete the admin consent for role ${appAdminConsent.id} from application service principle ${servicePrincipleId}. Error is ${removeAdminConsentResult[1]}`);
                                //     }
                                // }

                            }

                            //* Get the resource role structure ready
                            const forLoop = async _ => {

                                for(let resourceProviderKey of resourceProvidersHashMapKeys) {

                                    //* Get manifest details of resource provider app
                                    let resourceProviderAppManifestDetailsResult = await module.exports.getManifestFileWithClientId(xid, azureToken, azureConfig, resourceProviderKey, azureId);
                                    if(resourceProviderAppManifestDetailsResult[0] === 'SUCCESS') {

                                        if(resourceProviderAppManifestDetailsResult[1].value.length > 0) {

                                            //* Store the app roles
                                            let resourceProviderAppRoles = resourceProviderAppManifestDetailsResult[1].value[0].appRoles;

                                            //* Check if role exist and remove admin consent
                                            for(let resourceProviderValue of resourceProvidersHashMap[resourceProviderKey]) {
                                                for(let resourceProviderAppRole of resourceProviderAppRoles) {
                                                    if(resourceProviderValue.resourceRole === resourceProviderAppRole.displayName.trim()) {
                                                        
                                                        //* Get the admin consent id
                                                        // console.log(adminConsentResourceProviderHashMapKeys)
                                                        // console.log(resourceProviderAppRole.id);
                                                        if(adminConsentResourceProviderHashMapKeys.includes(resourceProviderAppRole.id)) {

                                                            let adminConsentId = adminConsentResourceProviderHashMap[resourceProviderAppRole.id][0].id;

                                                            //* Remove admin consent
                                                            let removeAdminConsentResult = await module.exports.deleteAdminConsentForResourceRole(xid, azureToken, azureConfig, servicePrincipleId, adminConsentId);
                                                            if(removeAdminConsentResult[0] === 'SUCCESS') {
                                                                removedAdminConsents.push({"resourceAppId": resourceProviderKey, "resourceRoleId":resourceProviderAppRole.id, "resourceRole": resourceProviderValue.resourceRole});
                                                                removedAdminConsentResourceRoles.push(resourceProviderValue.resourceRole);
                                                            }
                                                            else if(removeAdminConsentResult[0] === 'ERROR') {
                                                                return removeAdminConsentResult;
                                                            }
                                                        }
                                                        
                                                    }
                                                }
                                            }

                                        }
                                        else {
                                            sails.log.info("XID: " + xid + " | ", new Date, `: azureServices.removeResourceRole: No manifest data found for resource provider app id ${resourceProviderKey} for application ${azureRegisteredAppName}`);
                                        }
                                    }
                                    else if(resourceProviderAppManifestDetailsResult[0] === 'ERROR') {
                                        return resourceProviderAppManifestDetailsResult;
                                    }
                                }
                            }
                            
                            await forLoop();

                            //* Remove the Resource Role from Required Resource Access
                            let newRequiredResourceAccess = [];
                            const requiredResourceAccessForLoop = async _ => {

                                for(let resource of requiredResourceAccess) {

                                    let resourceAppId = resource.resourceAppId;
                                    let resourceAccesses = resource.resourceAccess;
                                    let newResourceAccesses = [];
    
                                    const resourceAccessForLoop = async _ => {
    
                                        for(let resourceAccess of resourceAccesses) {
                                        
                                            let isResourceToBeRemoved = removedAdminConsents.filter((removedAdminConsent) => {return removedAdminConsent.resourceAppId === resourceAppId && removedAdminConsent.resourceRoleId === resourceAccess.id});
                                            if(isResourceToBeRemoved.length > 0) {
        
                                                //* This role not to be included
                                                
                                            }
                                            else {
                                                newResourceAccesses.push(resourceAccess);
                                            }
                                        }
                                    }
                                    
                                    await resourceAccessForLoop();
                                    
                                    if(newResourceAccesses.length > 0) {
                                        let data = {
                                            "resourceAppId": resourceAppId,
                                            "resourceAccess": newResourceAccesses
                                        }
    
                                        newRequiredResourceAccess.push(data);
                                    }
                                    
                                    
                                }
                            }
                            
                            await requiredResourceAccessForLoop();
                            //console.log(newRequiredResourceAccess)

                            let postBody = {
                                "requiredResourceAccess": newRequiredResourceAccess
                            }

                            let updateResourceRoleValueResult = await module.exports.updateResourceRoleValue(xid, azureToken, azureConfig, azureId, postBody);
                            if(updateResourceRoleValueResult[0] === 'SUCCESS') {

                                return ['SUCCESS', `Successfully removed the resource roles ${removedAdminConsentResourceRoles} from azure application ${azureRegisteredAppName} of id ${azureId}`];
                            }
                            else if(updateResourceRoleValueResult[0] === 'ERROR') {
                                return updateResourceRoleValueResult;
                            }
                        }
                        else if (adminConsentAssociatedToApplicationResult[0] === 'ERROR') {
                            return adminConsentAssociatedToApplicationResult;
                        }
                    }
                    else if (servicePrincipleResult[0] === 'ERROR') {
                        return servicePrincipleResult;
                    }

                }
                else if (manifestFileResult[0] === 'ERROR') {
                    return manifestFileResult;
                }
            }
            else {
                return ['SUCCESS', `The provided resource role is empty or null. Nothing to remove.`];
            }

        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: azureServices.removeResourceRole: ERROR: Failed to remove resource roles from application ${azureRegisteredAppName}. Error is ${error}`);
            return ['ERROR', `Failed to remove resource roles from application ${azureRegisteredAppName}. Error is ${error}`];
        }
    }



}
