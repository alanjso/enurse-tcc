'use strict';
const nodemailer = require('nodemailer');
const config = require('config');
const ConfigGeral = require('../configuracao/configuracao.model');

let emailSenderConfig;
// async..await is not allowed in global scope, must use a wrapper
module.exports = async function enviaEmail(emailTo, subject, text, html) {
    const configGeral = await ConfigGeral.findOne();
    emailSenderConfig = configGeral.email;
    // create reusable transporter object using the SMTP transport
    let transporter = nodemailer.createTransport({
        host: emailSenderConfig.hostSMTP,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: emailSenderConfig.address, // email sender
            pass: emailSenderConfig.password // password
        },
        tls: { rejectUnauthorized: false }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"${emailSenderConfig.name}" <${emailSenderConfig.address}>`, // sender address
        to: `${emailTo}`,// list of receivers
        subject: subject ? `${subject}` : 'Assunto em branco', // Subject line
        text: text ? `${text}` : 'texto vazio', // plain text body
        html: html ? `${html}` : '' // html body
    });
}
