const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const usersFile = './users.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the public directory

// Load users from file
const loadUsers = () => {
    if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile);
        return JSON.parse(data);
    }
    return [];
};

// Save users to file
const saveUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Login Endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (user && user.password === password) {  // Direct comparison
        return res.json({ user: { id: user.id, username: user.username }, walletBalance: user.walletBalance });
    }
    res.status(401).json({ message: 'Invalid credentials' });
});

// Register Endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user with plain text password
    const newUser = { id: users.length + 1, username, password, walletBalance: 100 };
    users.push(newUser);
    saveUsers(users);
    return res.status(201).json({ message: 'User created' });
});

// Transfer Funds Endpoint
app.post('/transfer', (req, res) => {
    const { amount, recipient, userId } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    const recipientUser = users.find(u => u.username === recipient);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!recipientUser) {
        return res.status(404).json({ message: 'Recipient not found' });
    }
    if (amount <= 0 || typeof amount !== 'number') {
        return res.status(400).json({ message: 'Invalid transfer amount' });
    }
    if (user.walletBalance < amount) {
        return res.status(400).json({ message: 'Insufficient funds' });
    }

    user.walletBalance -= amount;
    recipientUser.walletBalance += amount;
    saveUsers(users);
    return res.json({ newBalance: user.walletBalance });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
