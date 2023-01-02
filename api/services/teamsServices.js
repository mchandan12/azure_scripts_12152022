module.exports = {

    getTeamMembers: async (xid, teamEmail) => {

        sails.log.info("XID: " + xid + " | ", new Date, ": teamsServices.getTeamMembers: Calling database service to get team members details");
        try {
            const teamMembers = await TeamMembers.find({
                where: { teamEmail: teamEmail },
                select: ['memberEmail','teamName']
            })
            
            sails.log.info("XID: " + xid + " | ", new Date, ": teamsServices.getTeamMembers: Successfully received the team Members Details");
            return ["SUCCESS", teamMembers];
        }
        catch(error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: teamsServices.getTeamMembers: ERROR: Failed to get team members details from database of teamEmail ${teamEmail}. Error is ${error}`);
            return ["ERROR", error];
        }

    }
}