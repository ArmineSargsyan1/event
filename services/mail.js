import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const { EMAIL, EMAIL_PASSWORD, EMAIL_HOST} = process.env;


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  },
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
    console.log(error)
    throw error;
  }
};
