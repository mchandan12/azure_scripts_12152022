module.exports = {

    addClientSecretValidity: async (xid, appId, org, azureObjectId, apigeeAppName, secretId, secretExpireDate, developer) => {

        //* Check if data it already present in ClientSecretExpiryDetails Table
        try {
            let clientSecretValidityExistsResult = await ClientSecretValidity.find({
                where: { id: appId, AzureObjectId: azureObjectId }
            });
    
            if (clientSecretValidityExistsResult.length <= 0) {
                let clientSerectValidityData = {
                    "id": appId,
                    "ApigeeAppName": apigeeAppName,
                    "AzureObjectId": azureObjectId,
                    "AzureSecretKeyId": secretId,
                    "AzureSecretExpire": secretExpireDate,
                    "EmailAlertFlag": 0,
                    "Organization": org,
                    "Developer": developer
                }
    
                //* Add client secret validity to database
                sails.log.info("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.addClientSecretValidity: Adding client secret validity details of appplication ${azureObjectId} to database`);
    
                await ClientSecretValidity.create(clientSerectValidityData)
                    .then((data) => {
                        sails.log.info("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.addClientSecretValidity: Successfully added client secret validity details of appplication ${azureObjectId} to database`);
                        return ['SUCCESS', `Successfully added client secret validity details of appplication ${azureObjectId} to database`];
                    })
                    .catch((error) => {
                        sails.log.error("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.addClientSecretValidity: ERROR: Failed to add client secret validity details of appplication ${azureObjectId} to database. Error is ${error}`);
                        return ['ERROR', `Failed to add client secret validity details of appplication ${azureObjectId} to database. Error is ${error}`];
                    });
            }
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.addClientSecretValidity: ERROR: Failed to add client secret validity details of appplication ${azureObjectId} to database. Error is ${error}`);
            return ['ERROR', `Failed to add client secret validity details of appplication ${azureObjectId} to database. Error is ${error}`]
        }
    },

    deleteClientSecretValidity: async (xid, appId) => {

        //* Check if data it already present in ClientSecretExpiryDetails Table
        try {
            let previousAzureObjectId = await ClientSecretValidity.find({
                where: { id: appId},
                select: ['AzureObjectId']
            });
    
            if (previousAzureObjectId.length > 0) {
    
                //* Delete client secret validity data of previous azureObjectId from database
                sails.log.info("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.deleteClientSecretValidity: Deleting client secret validity details of old appplication ${appId} from database`);
    
                let deleteClientSecretValidityResult = await ClientSecretValidity.destroy({id: appId, AzureObjectId: previousAzureObjectId[0].AzureObjectId});
                sails.log.info("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.deleteClientSecretValidity: Successfully deleted client secret validity details of old appplication ${appId} from database`);
                return ['SUCCESS', `Successfully deleted client secret validity details of old appplication ${appId} from database`];    
            }
            else {
                sails.log.error("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.deleteClientSecretValidity: ERROR: No records found for old application ${appId} in client secret validity table`);
                return ['ERROR', `No records found for old application ${appId} in client secret validity table`];
            }
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: clientSecretValidityServices.deleteClientSecretValidity: ERROR: Failed to delete client secret validity details of old appplication ${appId} from database. Error is ${error}`);
            return ['ERROR', `Failed to delete client secret validity details of old appplication ${appId} from database. Error is ${error}`]
        }
    }
}
