require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedUsers = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        // Clear existing users to avoid duplicates
        await User.deleteMany({});
        console.log('Cleared existing users.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const users = [
            // 2 Admin accounts
            {
                name: 'Admin One',
                email: 'admin1@wildcamp.com',
                password: hashedPassword,
                role: 'admin'
            },
            {
                name: 'Admin Two',
                email: 'admin2@wildcamp.com',
                password: hashedPassword,
                role: 'admin'
            },
            // 5 Customer accounts
            {
                name: 'Nguyen Van A',
                email: 'customer1@gmail.com',
                password: hashedPassword,
                role: 'customer'
            },
            {
                name: 'Tran Thi B',
                email: 'customer2@gmail.com',
                password: hashedPassword,
                role: 'customer'
            },
            {
                name: 'Le Van C',
                email: 'customer3@gmail.com',
                password: hashedPassword,
                role: 'customer'
            },
            {
                name: 'Pham Thi D',
                email: 'customer4@gmail.com',
                password: hashedPassword,
                role: 'customer'
            },
            {
                name: 'Hoang Van E',
                email: 'customer5@gmail.com',
                password: hashedPassword,
                role: 'customer'
            }
        ];

        await User.insertMany(users);
        console.log('Successfully seeded 2 admin and 5 customer accounts!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedUsers();
