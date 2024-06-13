require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fetch = require('node-fetch');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const secretKey = process.env.SECRET_KEY;
const mongoUrlLocal = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
const databaseName = "todo-db";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files from the 'public' directory
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true if using https
}));

let db;

// Connect to the database once and reuse the connection
MongoClient.connect(mongoUrlLocal, {})
    .then(client => {
        db = client.db(databaseName);
        console.log('Connected to the database');
    })
    .catch(error => {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    });

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Serve the index.html file
});

// User registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await db.collection('users').findOne({ email });

        if (user) {
            return res.status(400).send({ message: 'User already exists' });
        }

        await db.collection('users').insertOne({ email, password: hashedPassword });
        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.collection('users').findOne({ email });

        if (!user || !await bcrypt.compare(password, user.password)) {
            res.status(401).send({ message: 'Invalid email or password' });
        } else {
            const token = jwt.sign({ email: user.email }, secretKey, { expiresIn: '15m' }); // Short-lived access token
            const refreshToken = crypto.randomBytes(64).toString('hex'); // Generate refresh token

            // Store refresh token in database
            await db.collection('refreshTokens').insertOne({ token: refreshToken, email: user.email });

            res.send({ token, refreshToken });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Add a new task
app.post('/add-task', authenticateToken, async (req, res) => {
    const { task, dueDate, priority } = req.body;

    try {
        const result = await db.collection('todos').insertOne({
            task,
            dueDate,
            priority,
            completed: false,
            user: req.user.email
        });
        const newTask = await db.collection('todos').findOne({ _id: result.insertedId });
        res.send(newTask);
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Get all tasks for the logged-in user
app.get('/get-todos', authenticateToken, async (req, res) => {
    try {
        const todos = await db.collection('todos').find({ user: req.user.email }).toArray();
        res.send(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Delete a task
app.delete('/delete-task/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    try {
        await db.collection('todos').deleteOne({ _id: new ObjectId(id), user: req.user.email });
        res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Toggle task completion
app.put('/toggle-complete/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const completed = req.body.completed;

    try {
        await db.collection('todos').updateOne({ _id: new ObjectId(id), user: req.user.email }, { $set: { completed } });
        res.sendStatus(200);
    } catch (error) {
        console.error('Error toggling task completion:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Update a task
app.put('/update-task/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { task, dueDate, priority } = req.body;

    try {
        await db.collection('todos').updateOne({ _id: new ObjectId(id), user: req.user.email }, { $set: { task, dueDate, priority } });
        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Endpoint to fetch a motivational quote
app.get('/get-quote', async (req, res) => {
    try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        res.send(data);
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).send({ error: 'Failed to fetch quote' });
    }
});

// Endpoint to fetch a background image
app.get('/get-background-image', async (req, res) => {
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=nature&client_id=${unsplashAccessKey}`);
        const data = await response.json();
        res.send({ url: data.urls.full });
    } catch (error) {
        console.error('Error fetching background image:', error);
        res.status(500).send({ error: 'Failed to fetch background image' });
    }
});

app.listen(3001, () => {
    console.log("App listening on port 3001!");
});
