const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2klnknx.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // collection starts here 
        const classesCollections = client.db('crownArt').collection('classes')
        const selectedClassCollections = client.db('crownArt').collection('selected')
        const userCollections = client.db('crownArt').collection('users')
        // collection ends here 

        // load all the classes in classes page 
        app.get('/classes', async (req, res) => {
            const result = await classesCollections.find({}).toArray();
            res.send(result)
        })

        // load specific student booked class in dashobard
        app.get('/selected/classes', async (req, res) => {
            const email = req.query.email;
            // console.log(email)
            const query = { email: email }
            const result = await selectedClassCollections.find(query).toArray()
            res.send(result);
        }),
            // load all the users 
            app.get('/users', async (req, res) => {
                const result = await userCollections.find({}).toArray();
                res.send(result)
            })
        // student select the class 
        app.post('/classes', async (req, res) => {
            const selectedCourse = req.body;
            // console.log(selectedCourse)
            const result = await selectedClassCollections.insertOne(selectedCourse)
            // console.log(result)
            res.send(result)
        })

        // store user information when sign up and check to prevent duplicate entry
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            // console.log(userInfo)
            const query = { email: userInfo?.email }
            const existingUser = await userCollections.findOne(query)
            if (existingUser) {
                return res.send({ message: 'User Already Exsist' })
            }
            const result = await userCollections.insertOne(userInfo)
            res.send(result)
        })

        // make user instructor using id 
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // console.log(query)
            const updatedDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await userCollections.updateOne(query, updatedDoc)
            console.log(result)
            // res.send(result);
        })

        // make user instructor using id 
        app.patch('/admin/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // console.log(query)
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollections.updateOne(query, updatedDoc)
            console.log(result)
            // res.send(result);
        })
        // student remove class from their dashboard
        app.delete('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await selectedClassCollections.deleteOne(query)
            res.send(result)
        })






























        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`server is running in port ${port}`)
})