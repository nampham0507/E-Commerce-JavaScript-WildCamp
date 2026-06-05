require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        // Clear existing users to avoid duplicates
        await User.deleteMany({});
        console.log('Cleared existing users.');

        // Plain passwords — the User model pre-save hook hashes them automatically
        const users = [
            { name: 'Admin One',    email: 'admin1@wildcamp.com', password: 'password123', role: 'admin' },
            { name: 'Admin Two',    email: 'admin2@wildcamp.com', password: 'password123', role: 'admin' },
            { name: 'Nguyen Van A', email: 'customer1@gmail.com', password: 'password123', role: 'customer' },
            { name: 'Tran Thi B',   email: 'customer2@gmail.com', password: 'password123', role: 'customer' },
            { name: 'Le Van C',     email: 'customer3@gmail.com', password: 'password123', role: 'customer' },
            { name: 'Pham Thi D',   email: 'customer4@gmail.com', password: 'password123', role: 'customer' },
            { name: 'Hoang Van E',  email: 'customer5@gmail.com', password: 'password123', role: 'customer' }
        ];

        // create() triggers the pre-save hook for each document (insertMany would NOT)
        await User.create(users);
        console.log('Successfully seeded 2 admin and 5 customer accounts!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedUsers();
