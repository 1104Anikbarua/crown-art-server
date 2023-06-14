const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET);
// console.log(stripe)

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

// verifyJwt functions
const verifyJwt = (req, res, next) => {
    // console.log('inside jwt', req.headers.authorization)
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, Message: 'Unauthorized Access from line 31' })
    }
    const token = authorization.split(' ')[1]
    // console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, Message: 'Forbiden Access from line 37' })
        }
        req.decoded = decoded
        next()
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)


        // collection starts here 
        const classesCollections = client.db('crownArt').collection('classes')
        const selectedClassCollections = client.db('crownArt').collection('selected')
        const userCollections = client.db('crownArt').collection('users')

        const instructorClassCollections = client.db('crownArt').collection('instructorClass')

        const studentPaymentCollection = client.db('crownArt').collection('payments')
        // collection ends here 

        // load all the classes in classes page 
        app.get('/classes', async (req, res) => {
            const result = await instructorClassCollections.find({}).toArray();
            res.send(result)
        })

        // load all the instructor to find popular instructor
        app.get('/instructors/popular', async (req, res) => {
            // const options = {
            //     projection: {
            //         title: 1,
            //         img: 1,
            //         price: 1,
            //         service_id: 1,
            //     }
            // }
            const result = await instructorClassCollections.find({}).toArray();
            res.send(result)
        })
        // load all the instructor to find popular instructor
        app.get('/classes/popular', async (req, res) => {
            // const options = {
            //     projection: {
            //         title: 1,
            //         img: 1,
            //         price: 1,
            //         service_id: 1,
            //     }
            // }
            const result = await instructorClassCollections.find({}).toArray();
            res.send(result)
        })


        // load specific student booked class in dashobard
        app.get('/selected/classes', async (req, res) => {
            const email = req.query?.email;
            // console.log(email)
            const query = { email: email }
            const result = await selectedClassCollections.find(query).toArray()
            res.send(result);
        }),

            // load all the users 
            app.get('/users', verifyJwt, async (req, res) => {
                const result = await userCollections.find({}).toArray();
                res.send(result)
            })

        // verify the user is admin or not 
        app.get('/users/admin', verifyJwt, async (req, res) => {
            const email = req.query?.email;
            // console.log('109', req.query)
            const decodedEmail = req.decoded?.email;
            // console.log('122', decodedEmail)
            // console.log('123', email)
            if (decodedEmail !== email) {
                res.send({ admin: false })
            }
            const query = { email: email };
            const user = await userCollections.findOne(query);
            const admin = { admin: user?.role === 'admin' }
            // console.log(admin)
            res.send(admin)
        })
        // check user instructor or not 
        app.get('/users/instructor', verifyJwt, async (req, res) => {
            const email = req.query?.email;
            // console.log('109', req.query)
            const decodedEmail = req.decoded?.email;
            // console.log('122', decodedEmail)
            // console.log('123', email)
            if (decodedEmail !== email) {
                res.send({ instructor: false })
            }
            const query = { email: email };
            const user = await userCollections.findOne(query);
            const instructor = { instructor: user?.role === 'instructor' }
            // console.log(instructor)
            res.send(instructor)
        })

        // get all the classes of an instructor in my classes page 
        app.get('/instructor/classes', async (req, res) => {
            const email = req.query?.email;
            const query = { email: email }
            const result = await instructorClassCollections.find(query).toArray()
            res.send(result);
        })

        // load all the classes in the admin dashboard 
        app.get('/admin/classes', async (req, res) => {
            const result = await instructorClassCollections.find({}).toArray()
            res.send(result);
        })

        // load class based on id for payments 
        app.get('/selected/classes/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) }
            const result = await selectedClassCollections.findOne(query)
            res.send(result)
        })

        // load paid classes in the  my enrolled classese 
        app.get('/enrolled', async (req, res) => {
            const email = req.query?.email;
            const query = { studentEmail: email }
            const result = await instructorClassCollections.find(query).toArray();
            // console.log(result)
            res.send(result);
        })
        // load payment history in my payment history 
        app.get('/payments', async (req, res) => {
            const email = req.query?.email;
            // console.log(email)
            const query = { email: email }
            const result = await selectedClassCollections.find(query).sort({ time: 1 }).toArray();
            res.send(result)
        })
        // load all the user and filter only users 
        app.get('/instructors', async (req, res) => {
            // const query={};
            const result = await userCollections.find({}).toArray()
            res.send(result);
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

        // create token and send to client side 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            // console.log(user)
            res.send(token)

        })
        // instructor add a class 
        app.post('/instructor', async (req, res) => {
            const classInfo = req.body;
            // console.log(classInfo)
            const result = await instructorClassCollections.insertOne(classInfo)
            // console.log(result)
            res.send(result);
        });

        // post price and create payment intent 
        app.post('/create-payment-intent', async (req, res) => {
            // console.log(req.body)
            const courseFee = req.body;
            // console.log(courseFee)
            const price = courseFee?.price;
            const amount = price * 100;
            // console.log(amount)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: [
                    "card"
                ],
            })
            res.send({ clientSecret: paymentIntent.client_secret });
        });

        // make user instructor using id 
        app.patch('/instructor/users/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) }
            // console.log(query)
            const updatedDoc = {
                $set: {
                    role: 'instructor'
                }
            }
            const result = await userCollections.updateOne(query, updatedDoc)
            // console.log(result)
            res.send(result);
        })

        // make user instructor using id 
        app.patch('/admin/users/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) }
            // console.log(query)
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollections.updateOne(query, updatedDoc)
            // console.log(result)
            res.send(result);
        })

        // denied course approval 
        app.patch('/admin/denies/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'denied'
                }
            }
            const result = await instructorClassCollections.updateOne(query, updatedDoc)
            // console.log(result);
            res.send(result);

        })
        // Approved course approval 
        app.patch('/admin/approves/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'approved'
                }
            }
            const result = await instructorClassCollections.updateOne(query, updatedDoc)
            // console.log(result);
            res.send(result);

        })
        // admin give feedback 
        app.patch('/admin/feedbacks/:id', async (req, res) => {
            const id = req.params?.id;
            const feedback = req.body?.feedBack;
            // console.log(feedback, '226')
            const query = { _id: new ObjectId(id) };
            // console.log(query, "227")
            const updatedDoc = {
                $set: { feedback: feedback }
            }
            const result = await instructorClassCollections.updateOne(query, updatedDoc)
            // console.log(result)
            res.send(result)
        })

        // update class payment status in selected class collections and reduce one seat in instructor class collection 
        app.patch('/classes/payment/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const payment = req.body;
            // console.log(payment)
            const paymentDetail = {
                className: payment?.className,
                trxid: payment?.trxid,
                studentName: payment?.name,
                email: payment?.email,
                time: payment.time
            }
            const query = { _id: new ObjectId(payment?.mainCourseId) };
            // console.log(query)

            const enrolledNumber = await instructorClassCollections.findOne(query)
            // console.log(enrolledNumber)
            const seats = enrolledNumber?.availableSeats;
            let enrolled = 0;
            if (enrolledNumber?.enrolled) {
                enrolled = enrolledNumber.enrolled + 1
            }
            else {
                enrolled = 1
            }
            const updatedDoc = {
                $set: {
                    enrolled: enrolled,
                    availableSeats: seats - 1,
                    studentEmail: payment.email,
                    time: payment.time,
                }
            }
            const result = await instructorClassCollections.updateOne(query, updatedDoc)
            res.send(result)
        })

        // update payment information 
        app.patch('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment?.trxid,
                    time: payment.time
                }
            }
            const result = await selectedClassCollections.updateOne(query, updatedDoc)
            res.send(result)
        })
        app.patch('/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const photo = req.body
            // console.log(photo)
            const query = { _id: new ObjectId(id) };
            // console.log(query)
            const updatedDoc = {
                $set: {
                    photo: photo?.photo
                }
            }
            const result = await instructorClassCollections.updateOne(query, updatedDoc)
            res.send(result);

        })

        // student remove class from their dashboard
        app.delete('/classes/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) }
            const result = await selectedClassCollections.deleteOne(query)
            res.send(result)
        })


        // temporary update instructor 
        // app.patch('/instructor/update/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const photo = req.body
        //     console.log(photo)
        //     const query = { _id: new ObjectId(id) };
        //     // console.log(query)
        //     const updatedDoc = {
        //         $set: {
        //             image: photo?.photo
        //         }
        //     }
        //     const result = await userCollections.updateOne(query, updatedDoc)
        //     res.send(result);
        // })





























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