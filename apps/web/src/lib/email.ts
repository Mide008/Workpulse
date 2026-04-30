import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendMailOptions) {
  return transporter.sendMail({
    from: '"WorkPulse" <' + process.env.SMTP_USER + '>',
    to: to,
    subject: subject,
    html: html,
  })
}