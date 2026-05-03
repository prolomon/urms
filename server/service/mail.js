// require("dotenv").config();
import nodemailer from "nodemailer";

const cleanEnvValue = (value, fallback = "") =>
  String(value ?? fallback)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "");

const smtpHost = cleanEnvValue(process.env.SMTP_HOST);
const smtpUser = cleanEnvValue(process.env.SMTP_USER);
const smtpPass = cleanEnvValue(process.env.SMTP_PASS);

const smtpPort = Number.parseInt(cleanEnvValue(process.env.SMTP_PORT, "587"), 10);
const smtpSecure = cleanEnvValue(process.env.SMTP_SECURE).toLowerCase() === "true"
  ? true
  : smtpPort === 465;

const createSmtpTransport = (port, secure) =>
  nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: Number.parseInt(cleanEnvValue(process.env.SMTP_CONNECTION_TIMEOUT_MS, "15000"), 10),
    greetingTimeout: Number.parseInt(cleanEnvValue(process.env.SMTP_GREETING_TIMEOUT_MS, "15000"), 10),
    socketTimeout: Number.parseInt(cleanEnvValue(process.env.SMTP_SOCKET_TIMEOUT_MS, "20000"), 10),
    requireTLS: !secure,
    tls: {
      servername: smtpHost,
      rejectUnauthorized:
        cleanEnvValue(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, "true").toLowerCase() !== "false",
    },
  });

// Create a transporter using SMTP
export const transporter = createSmtpTransport(smtpPort, smtpSecure);

const shouldRetryWithFallback = (error) => {
  const code = String(error?.code || "").toUpperCase();
  return code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET";
};

export const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: smtpUser,
    to,
    subject,
    html: text,
    text: String(text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  };

  try {
    const result = await new Promise((resolve) => {
      transporter.sendMail(
        mailOptions,
        (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
            return resolve({
              ok: false,
              error: error?.message || "Failed to send email",
              code: error?.code,
            });
          }

          console.log("Email sent:", info?.messageId);
          return resolve({ ok: true, messageId: info?.messageId });
        },
      );
    });

    if (!result?.ok && shouldRetryWithFallback(result) && smtpPort !== 465) {
      const fallbackTransporter = createSmtpTransport(465, true);
      const fallbackResult = await new Promise((resolve) => {
        fallbackTransporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Fallback SMTP send failed:", error);
            return resolve({
              ok: false,
              error: error?.message || "Failed to send email",
              code: error?.code,
            });
          }

          console.log("Email sent with fallback SMTP:", info?.messageId);
          return resolve({ ok: true, messageId: info?.messageId });
        });
      });

      return fallbackResult;
    }

    return result;
  } catch (error) {
    console.error("Error sending email:", error);

    if (shouldRetryWithFallback(error) && smtpPort !== 465) {
      try {
        const fallbackTransporter = createSmtpTransport(465, true);
        const info = await fallbackTransporter.sendMail(mailOptions);
        console.log("Email sent with fallback SMTP:", info?.messageId);
        return { ok: true, messageId: info?.messageId };
      } catch (fallbackError) {
        console.error("Fallback SMTP send failed:", fallbackError);
      }
    }

    return { ok: false, error: error?.message || "Failed to send email" };
  }
};

export const verifyEmail = async (to, token) => {
  const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
  const subject = "Verify Your Email Address";
  const text = `Please click the following link to verify your email address: ${verificationLink}`;
  await sendEmail(to, subject, text);
};

export const verifyProtocol = async () => {
  try {
    await transporter.verify();
    console.log("Server is ready to take our messages");
    return true;
  } catch (err) {
    console.error("Verification failed:", err);
    return false;
  }
};