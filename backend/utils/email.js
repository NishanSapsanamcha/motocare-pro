import nodemailer from "nodemailer";

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing in .env`);
  }
  return value;
};

const buildTransport = () => {
  const host = requireEnv("SMTP_HOST");
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

export const sendResetEmail = async ({ to, resetUrl }) => {
  const transport = buildTransport();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "Motocare Pro";
  const from = `${fromName} <${fromEmail}>`;

  await transport.sendMail({
    from,
    to,
    subject: "Reset your password",
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};
