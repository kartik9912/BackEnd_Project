const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Helper function to read users from the JSON file
const readUsersFile = (callback) => {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users file:', err);
            callback(err, null);
        } else {
            try {
                const users = data ? JSON.parse(data) : [];
                callback(null, users);
            } catch (parseErr) {
                console.error('Error parsing JSON:', parseErr);
                callback(parseErr, null);
            }
        }
    });
};

// Helper function to write users to the JSON file
const writeUsersFile = (data, callback) => {
    fs.writeFile('users.json', JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing to users file:', err);
            callback(err);
        } else {
            callback(null);
        }
    });
};

// Signup endpoint
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    console.log('Signup request:', req.body);

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Read users from the file
    readUsersFile((err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Check if the user already exists
        const userExists = users.some(user => user.email === email);
        if (userExists) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        // Add the new user (with name, email, and password)
        users.push({ name, email, password });

        // Write the updated user list to the file
        writeUsersFile(users, (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ success: false, message: 'Server error' });
            }
            res.json({ success: true, message: 'Signup successful!' });
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login request:', req.body);

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Read users from the file
    readUsersFile((err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Check if the user exists with the correct password
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            return res.json({ success: true, message: 'Login successful!' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Fetch all users endpoint
app.get('/users', (req, res) => {
    // Read users from the file
    readUsersFile((err, users) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, users });
    });
});
