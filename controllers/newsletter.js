import Newsletter from "../models/Newsletter.js";
import { sendMail } from "../services/mail.js";

export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const existing = await Newsletter.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This email is already subscribed!",
      });
    }

    await Newsletter.create({ email });

    await sendMail({
      to: email,
      subject: "Welcome to StayVista! Your 10% Discount Inside",
      template: "welcomeNewsletter",
      templateData: {},
    });

    res.status(201).json({
      success: true,
      message: "Thank you for subscribing! Check your email for a welcome gift.",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later.",
    });
  }
};
