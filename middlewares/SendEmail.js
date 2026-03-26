// import sgMail from "@sendgrid/mail";

// // Initialize SendGrid safely
// if (!process.env.SENDGRID_API_KEY) {
//   console.error("❌ SENDGRID_API_KEY is missing in environment variables");
// } else {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

// export const sendEmail = async (to, otp) => {
//   try {
//     const msg = {
//       to: to,
//       from: "your_verified_email@example.com", // MUST be verified in SendGrid
//       subject: "Verification Code",

//       // Plain text fallback (important)
//       text: `Your OTP is ${otp}. It is valid for 5 minutes.`,

//       // ✅ Your SAME HTML (unchanged)
//       html: `
// <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
//   <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
//     <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
//       <h1 style="margin: 0; font-size: 22px;">UandIK</h1>
//     </div>

//     <div style="padding: 30px; text-align: center;">
//       <h2 style="color: #333;">Verify Your Email</h2>
//       <p style="color: #666;">Use the OTP below to complete your verification process.</p>

//       <div style="margin: 25px 0;">
//         <span style="
//           display: inline-block;
//           padding: 15px 25px;
//           font-size: 24px;
//           letter-spacing: 5px;
//           font-weight: bold;
//           color: #4f46e5;
//           background: #eef2ff;
//           border-radius: 8px;
//         ">
//           ${otp}
//         </span>
//       </div>

//       <p style="color: #999; font-size: 13px;">
//         This OTP is valid for 5 minutes. Do not share it with anyone.
//       </p>
//     </div>

//     <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #aaa;">
//       <p>If you didn’t request this, you can safely ignore this email.</p>
//     </div>

//   </div>
// </div>
//       `,
//     };

//     const response = await sgMail.send(msg);

//     console.log("✅ Email sent:", response[0].statusCode);
//     return true;

//   } catch (error) {
//     console.error("❌ SendGrid Error:");

//     if (error.response) {
//       console.error(error.response.body);
//     } else {
//       console.error(error.message);
//     }

//     return false;
//   }
// };