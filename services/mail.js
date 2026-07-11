// import path from 'path';
// import ejs from 'ejs';
// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
//
// dotenv.config();
//
// const { EMAIL, EMAIL_PASSWORD, EMAIL_HOST} = process.env;
//
//
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: EMAIL,
//     pass: EMAIL_PASSWORD,
//   },
// });
//
// export const sendMail = async ({to, subject, template, templateData = {}, attachments = []}) => {
//
//   try {
//     const templatePath = path.resolve('views/email', `${template}.ejs`);
//
//     const html = await ejs.renderFile(templatePath, templateData);
//
//     const mailOptions = {
//       from: EMAIL,
//       to,
//       subject,
//       html,
//       attachments,
//     };
//
//     const info = await transporter.sendMail(mailOptions);
//     return info;
//   } catch (error) {
//     console.log(error)
//     throw error;
//   }
// };


import ejs from 'ejs';
// import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import axios from "axios";
import path from "path";



export const sendMail = async ({
                                 to,
                                 subject,
                                 template,
                                 templateData = {},
                               }) => {
  console.log("📧 sendMail CALLED via Brevo API");

  try {
    const templatePath = path.resolve(
      "views/email",
      `${template}.ejs`
    );

    const html = await ejs.renderFile(
      templatePath,
      templateData
    );

    console.log("📧 BEFORE SEND (HTTP API REQUEST)");

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Event App",
          email: process.env.EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log("📧 AFTER SEND (API SUCCESS):", response.data);

    return response.data;

  } catch (error) {
    console.log(
      "❌ Brevo API Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};
