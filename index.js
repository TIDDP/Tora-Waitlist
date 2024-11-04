const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const User = require('./models/User');
const nodeCron = require('node-cron');
const nodemailer = require('nodemailer');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Basic route for the homepage
app.get('/', (req, res) => res.send('Waitlist App is running'));

// Add user to waitlist
app.post('/waitlist', async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        const newUser = new User({ email, firstName, lastName });
        await newUser.save();
        res.status(201).json({ message: 'User added to waitlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send bulk email
app.post('/send-email', async (req, res) => {
    const { message } = req.body;

    try {
        const users = await User.find({});
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send email to all users
        for (const user of users) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Notification from Waitlist App',
                text: message,
            });
        }

        res.status(200).json({ message: 'Emails sent to all users' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Keep the app active with a cron job
nodeCron.schedule('*/10 * * * *', () => {
    console.log("Pinged to keep the server awake!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
