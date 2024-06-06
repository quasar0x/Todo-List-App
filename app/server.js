const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const mongoUrlLocal = "mongodb://admin:password@localhost:27017";
const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const databaseName = "todo-db";

app.post('/add-task', (req, res) => {
    const task = req.body.task;
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, client) => {
        if (err) throw err;
        const db = client.db(databaseName);
        db.collection('todos').insertOne({ task, completed: false }, (err, result) => {
            if (err) throw err;
            res.send(result.ops[0]);
            client.close();
        });
    });
});

app.get('/get-todos', (req, res) => {
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, client) => {
        if (err) throw err;
        const db = client.db(databaseName);
        db.collection('todos').find({}).toArray((err, todos) => {
            if (err) throw err;
            res.send(todos);
            client.close();
        });
    });
});

app.delete('/delete-task/:id', (req, res) => {
    const id = req.params.id;
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, client) => {
        if (err) throw err;
        const db = client.db(databaseName);
        db.collection('todos').deleteOne({ _id: new ObjectId(id) }, (err, result) => {
            if (err) throw err;
            res.sendStatus(200);
            client.close();
        });
    });
});

app.put('/toggle-complete/:id', (req, res) => {
    const id = req.params.id;
    const completed = req.body.completed;
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, client) => {
        if (err) throw err;
        const db = client.db(databaseName);
        db.collection('todos').updateOne({ _id: new ObjectId(id) }, { $set: { completed } }, (err, result) => {
            if (err) throw err;
            res.sendStatus(200);
            client.close();
        });
    });
});

app.put('/update-task/:id', (req, res) => {
    const id = req.params.id;
    const task = req.body.task;
    MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, client) => {
        if (err) throw err;
        const db = client.db(databaseName);
        db.collection('todos').updateOne({ _id: new ObjectId(id) }, { $set: { task } }, (err, result) => {
            if (err) throw err;
            res.sendStatus(200);
            client.close();
        });
    });
});

// Endpoint to fetch a motivational quote
app.get('/get-quote', async (req, res) => {
    try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        res.send(data);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch quote' });
    }
});

app.listen(3001, () => {
    console.log("App listening on port 3001!");
});
