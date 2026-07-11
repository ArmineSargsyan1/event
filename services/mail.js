import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from "node:dns/promises";
dotenv.config();

const { EMAIL, EMAIL_PASSWORD, EMAIL_HOST} = process.env;

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: EMAIL,
//     pass: EMAIL_PASSWORD,
//   },
// });

console.log(await dns.lookup("smtp.gmail.com", { all: true }));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  },
});
console.log({
  EMAIL,
  hasPassword: !!EMAIL_PASSWORD,
});

try {
  await transporter.verify();
  console.log("✅ SMTP VERIFIED");
} catch (err) {
  console.error("❌ SMTP VERIFY ERROR:", err);
}

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
    console.log(error)
    throw error;
  }
};
