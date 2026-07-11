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




import axios from "axios";
import path from "path";

export const sendMail = async ({to, subject, template, templateData = {}, attachments = []}) => {
  console.log("📧 sendMail CALLED via Brevo API");
  try {
    const templatePath = path.resolve('views/email', `${template}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData);

    console.log("📧 BEFORE SEND (HTTP API REQUEST)");

    // 🚀 Ուղարկում ենք Brevo HTTP API-ով (Շրջանցում է Render-ի բոլոր SMTP արգելքները)
    const response = await axios.post('https://brevo.com', {
      sender: { name: "Event App", email: "armine9086@gmail.com" }, // Ձեր իրական Gmail-ը
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY, // Ձեր API Key-ը Render-ից
        'content-type': 'application/json'
      }
    });

    console.log("📧 AFTER SEND (API SUCCESS):", response.data);
    return response.data;
  } catch (error) {
    // Տպում ենք Brevo-ի իրական սխալը, եթե այդպիսին լինի
    console.log("❌ Brevo API Error:", error.response?.data || error.message);
    throw error;
  }
};
