const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config();
var jwt = require('jsonwebtoken');


//middleware
app.use(cors());
app.use(express.json());
function verifyJwt(req, res, next) {
    const authorizationToken = (req.headers.authorization);
    if (!authorizationToken) {
        res.status(401).send('unauthorized token');
    }
    const token = authorizationToken.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            res.status(401).send({ massage: 'forbiden access' })
        }

        req.decoded = decoded;
        next();
    })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0ctt95.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const collection = client.db("test").collection("devices");

async function run() {
    try {
        const categoryCollection = client.db('give-and-take').collection('category');
        const productsCollection = client.db('give-and-take').collection('products');
        const usersCollection = client.db('give-and-take').collection('users');
        const ordersCollection = client.db('give-and-take').collection('orders');

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

        //prost advertse products
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertise: '1',
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        //delete products
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        //get product by user seler id
        app.get('/products/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        //post user data to server.
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //delete user from database.
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        //get spesific user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })

        //get all seller or buyer
        app.get('/users/:options', verifyJwt, async (req, res) => {
            const options = req.params.options;
            const query = { options }
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });


        //get all advertise items
        app.get('/advertisedProduct/:email', async (req, res) => {
            const email = req.params.email;
            // const decodedMail = req.decoded.email;
            // if (email !== decodedMail) {
            //     return res.status(403).send({ massage: 'forbiden access' })
            // }
            const query = { email };
            const results = await productsCollection.find(query).toArray();
            const filterResult = results.filter(result => result.advertise == '1');
            res.send(filterResult);
        })

        //save orders in database
        app.post('/order', async (req, res) => {
            const orderInfo = req.body;
            const query = {
                email: orderInfo.email,
                itemPrice: orderInfo.itemPrice,
                itemName: orderInfo.itemName
            }
            // console.log(query);
            const alreadyBooked = await ordersCollection.find(query).toArray();
            if (alreadyBooked.length) {
                return res.send({ acknowledged: false })
            }
            const result = await ordersCollection.insertOne(orderInfo);
            res.send(result);
        })

        //get user booked data
        app.get('/order/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const decodedMail = req.decoded.email;
            if (email !== decodedMail) {
                return res.status(403).send({ massage: 'forbiden access' })
            }
            const query = { email }
            const resutl = await ordersCollection.find(query).toArray();
            res.send(resutl);
        })


        //update reported item
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    reportedItem: '1',
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })


        //get reported items from product cullection;
        app.get('/reportedItems', async (req, res) => {
            const query = {};
            const allresult = await productsCollection.find(query).toArray();
            const results = allresult.filter(result => result.reportedItem === '1');
            res.send(results);
        })

        //delete reported item
        app.delete('/reportedItems/:id', async (req, res) => {
            const id = req.params.id;
            const querry = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(querry);
            res.send(result);
        })


        //get jwt token
        //setup jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query?.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            console.log(email);
            // console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })

        //update seller status
        app.put('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    status: 'Verified',
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
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