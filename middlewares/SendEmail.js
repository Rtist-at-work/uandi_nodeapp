import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_APIKEY);

export const sendEmail = async (to, otp) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_USER, // default test sender
      to: to,
      subject: "Verification Code",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 22px;">UandIK</h1>
    </div>

    <div style="padding: 30px; text-align: center;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p style="color: #666;">Use the OTP below to complete your verification process.</p>

      <div style="margin: 25px 0;">
        <span style="
          display: inline-block;
          padding: 15px 25px;
          font-size: 24px;
          letter-spacing: 5px;
          font-weight: bold;
          color: #4f46e5;
          background: #eef2ff;
          border-radius: 8px;
        ">
          ${otp}
        </span>
      </div>

      <p style="color: #999; font-size: 13px;">
        This OTP is valid for 5 minutes. Do not share it with anyone.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #aaa;">
      <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>

  </div>
</div>
`,
    });

    console.log("Email sent:", response);
    return true;
  } catch (error) {
    console.error("Send OTP Error:", error);
    throw new Error("Failed to send email");
  }
};
