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




import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const { EMAIL, EMAIL_PASSWORD, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE } = process.env;

// const transporter = nodemailer.createTransport({
//   host: EMAIL_HOST || '://gmail.com',
//   port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
//   secure: String(EMAIL_SECURE) === 'true',
//   auth: {
//     user: EMAIL,
//     pass: EMAIL_PASSWORD,
//   },
//   family: 4
// });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: String(process.env.EMAIL_SECURE) === 'true',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  family: 4,
  tls: {
    rejectUnauthorized: false
  }
});

export const sendMail = async ({to, subject, template, templateData = {}, attachments = []}) => {
  try {
    const templatePath = path.resolve('views/email', `${template}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData);

    const mailOptions = {
      from: EMAIL,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.log("❌ Nodemailer error inside sendMail:", error);
    throw error;
  }
};
