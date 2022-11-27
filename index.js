const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config();


//middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0ctt95.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const collection = client.db("test").collection("devices");

async function run() {
    try {
        const categoryCollection = client.db('give-and-take').collection('category');
        const productsCollection = client.db('give-and-take').collection('products');
        const usersCollection = client.db('give-and-take').collection('users');

        //load all category
        app.get('/category', async (req, res) => {
            const querry = {}
            const result = await categoryCollection.find(querry).toArray();
            res.send(result);
        })

        //load product by category
        app.get('/product/:id', async (req, res) => {
            const categoryID = req.params.id;
            const query = { categoryID }
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        //post new product
        app.post('/product', async (req, res) => {
            const product = req.body;
            const cursor = await productsCollection.insertOne(product);
            res.send(cursor);
        })

        //post user data to server.
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //get all user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(error => console.log(error));

//testing purpase
app.get('/', (req, res) => {
    res.send('project server is running')
});
app.listen(port, () => {
    console.log(`server is running or port${port}`);
})