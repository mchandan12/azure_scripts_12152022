/**
 * EmailServices
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const mailConfig = JSON.parse(process.env.MAIL_CONFIG);
const apimConfig = JSON.parse(process.env.APIM_CONFIG);
const nodemailer = require('nodemailer');
const Blob = require('node-blob');
const teamsServices = require('./teamsServices');
const { v4: uuidv4 } = require('uuid');

module.exports = {

    sendEmail: async (xid, toEmail, subject, mailBody) => {

        let mailOptions = {};

        try {

            //*Send Email
            sails.log.info("XID: " + xid + " | ", new Date, ": EmailServices.sendEmail: Configuring to send an Email");
            let transporter = nodemailer.createTransport({
                host: mailConfig.mailHost,
                port: mailConfig.mailPort,
                secure: false, 

                auth: {
                    user: apimConfig.username, 
                    pass: apimConfig.password,
                },
                tls: {
                    //* do not fail on invalid certs
                    rejectUnauthorized: false
                }
            });

            mailOptions = {
                from: mailConfig.mailFrom,
                to: toEmail,
                bcc: mailConfig.bccEmail,
                subject: `${subject}`,
                html: mailBody
            };

            return new Promise(function (resolve, reject) {
                const notificationResult = transporter.sendMail(mailOptions, async function (error, info) {
                    if (error) {
                        sails.log.error("XID: " + xid + " | ", new Date, `: EmailServices.sendEmail: ERROR: Failed to send an email. Error is: ${error}`);
                        reject(["ERROR", `Failed to send an email. Error is: ${error}`]);
                    }
                    else {
                        sails.log.info("XID: " + xid + " | ", new Date, ": EmailServices.sendEmail: Email sent");
                        let emailHistoryData = {
                            "subject": subject,
                            "toAddress": toEmail
                        }
                        const emailHistoryResult = await EmailHistory.create(emailHistoryData);
                        resolve(["SUCCESS", "Email sent successfully"]);
                    }
                });
            });
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: EmailServices.sendEmail: ERROR: Failed to send an email. Error is: ${error}`);
            return ['ERROR', `Failed to send an email. Error is: ${error}`];
        }
    },

    processTeamEmail: async (xid, teamEmail) => {

        let teamMembers = '';
        let teamMembersMailIds = '';
        let isExternalOwner = false;
        let isTeam = false;
        let teamName = '';
        let senderEmail = '';

        try {
            if (teamEmail.split('@')[1] === "devteam.apigee.io") {
                isTeam = true;
                const teamMembersResult = await teamsServices.getTeamMembers(xid, teamEmail);
                if (teamMembersResult[0] === "SUCCESS") {
                    if (teamMembersResult[1].length > 0) {
                        for (teamId = 0; teamId < teamMembersResult[1].length; teamId++) {
                            teamName = teamMembersResult[1][teamId].teamName;
                            if (teamMembersResult[1][teamId].memberEmail.split('@')[1] !== 'intel.com') {
                                isExternalOwner = true;
                            }
                            if (teamMembers === '') {
                                teamMembers = teamMembersResult[1][teamId].memberEmail;
                            }
                            else {
                                teamMembers = teamMembers + ', ' + teamMembersResult[1][teamId].memberEmail;
                            }
                            if (teamMembersMailIds === '') {
                                teamMembersMailIds = "<" + teamMembersResult[1][teamId].memberEmail + ">;";
                            }
                            else {
                                teamMembersMailIds = teamMembersMailIds + "<" + teamMembersResult[1][teamId].memberEmail + ">;";
                            }
                        }
                        appOwnerInfo = teamMembers;
                    }
                    else {
                        teamMembersMailIds = '';
                    }
                }

            }
            else {
                teamMembersMailIds = teamEmail;
            }

            if (!(mailConfig.allowExternalEmailNotification)) {

                if (isTeam) {
                    if (isExternalOwner) {
                        sails.log.info("XID: " + xid + " | ", new Date, ": AppCreationService.sendMail: External Developer");
                        senderEmail = mailConfig.mailTo;
                    }
                    else if (teamMembersMailIds === '') {
                        senderEmail = mailConfig.mailTo;
                    }
                    else {
                        senderEmail = teamMembersMailIds;
                    }
                }
                else {
                    if (teamEmail.split("@")[1] === "intel.com") {
                        sails.log.info("XID: " + xid + " | ", new Date, ": AppCreationService.sendMail: Internal Developer");
                        senderEmail = teamEmail;
                    }
                    else {
                        sails.log.info("XID: " + xid + " | ", new Date, ": AppCreationService.sendMail: External Developer");
                        senderEmail = mailConfig.mailTo;
                    }
                }
            }
            else {
                if (isTeam) {

                    if (teamMembersMailIds === '') {
                        senderEmail = mailConfig.mailTo;
                    }
                    else {
                        senderEmail = teamMembersMailIds;
                    }
                }
                else {
                    senderEmail = teamEmail;
                }
            }

            let teamData = {
                "teamName": teamName,
                "senderEmail": senderEmail,
                "teamMembersMailIds": teamMembersMailIds,
                "isTeam": isTeam,
                "teamMembers": teamMembers
            }

            return ['SUCCESS', teamData];
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: EmailServices.processTeamEmail: ERROR: Failed to process the team email ${teamEmail}. Error is ${error}`);
            return ['ERROR', `Failed to process the team email ${teamEmail}. Error is ${error}`];
        }

    },

    addPendingEmails: async (xid, teamEmail, subject, mailBody) => {

        try {
            //* Convert Email body to Blob
            let myBlob = new Blob([mailBody], { type: 'text/html' });
            const guid = uuidv4();

            //*Add it to Pending Emails table
            const data = {
                "guid": guid,
                "teamEmail": teamEmail,
                "subject": `${subject}`,
                "body": myBlob.buffer
            };
            const pendingEmailsResult = await PendingEmails.create(data);
            sails.log.info("XID: " + xid + " | ", new Date, ": EmailServices.addPendingEmails: Successfully added the pending emails");
            return ['SUCCESS', 'Added Pending Emails'];
        }
        catch (error) {
            sails.log.error("XID: " + xid + " | ", new Date, `: EmailServices.addPendingEmails: ERROR: Failed to add the pending emails for teamEmail ${teamEmail}. Error is ${error}`);
            return ['ERROR', `Failed to add the pending emails for teamEmail ${teamEmail}. Error is ${error}`];
        }

    }

}

