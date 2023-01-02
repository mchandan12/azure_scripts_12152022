

module.exports = {

    azureLogs: async (xid, identifier, secondaryIdentifier, type, action, organization, logLevel, summary) => {

        try {
            
            sails.log.info("XID: " + xid + " | ", new Date, ": logServices.azureLogs: Adding azure logs to database");

            let data = {
                "id": xid,
                "Identifier": identifier,
                "Type": type,
                "Action": action,
                "SecondaryIdentifier": secondaryIdentifier,
                "Organization": organization,
                "LogLevel": logLevel,
                "Summary": summary
            }

            let addAzureLogsResult = await AzureLogs.create(data);
            return ['SUCCESS', addAzureLogsResult];
        }
        catch (error) {
            sails.log.info("XID: " + xid + " | ", new Date, `: logServices.azureLogs: ERROR: Failed to add azure logs to database. Error is ${error}`);
            return ['ERROR', `Failed to add azure logs to database. Error is ${error}`];
        }


    }
}