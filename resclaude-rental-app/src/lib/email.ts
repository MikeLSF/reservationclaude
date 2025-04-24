import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using nodemailer
 * @param options Email options (to, subject, text, html)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // For development, use a test account
  // In production, use real SMTP credentials
  let transporter;
  
  if (process.env.NODE_ENV === "production") {
    // Use real SMTP credentials in production
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Use Ethereal for development (fake SMTP service)
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const { to, subject, text, html } = options;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@example.com",
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br>"),
  };

  const info = await transporter.sendMail(mailOptions);

  // Log the URL for development (Ethereal)
  if (process.env.NODE_ENV !== "production") {
    console.log("Email preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
}
