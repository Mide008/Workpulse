require('dotenv').config({ path: '.env.local' })
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

transporter.sendMail({
  from: `"WorkPulse" <${process.env.SMTP_USER}>`,
  to: 'your-own-email@example.com', // change to your email
  subject: 'Test Email',
  html: '<p>If you see this, SMTP works!</p>',
})
.then(() => console.log('Email sent successfully'))
.catch(err => console.error('SMTP error:', err))