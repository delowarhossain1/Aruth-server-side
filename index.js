const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;
require('dotenv').config();

app.use(express.json());
app.use(cors());

// default route
app.get('/', (req, res)=>{
    res.send("The server is running")
})

// Verify token
function verifyToken(req, res, next) {
   const authorization = req.headers.auth;
   if(! authorization){
    return res.status(401).send({message : 'Unauthorize access'})
   }    

   const token = authorization.split(" ")[1];
   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{

    if(err){
      return  res.status(403).send({message : 'Forbidden access'});
    }
    else{
        res.decoded = decoded;
        next();
    }
   }) 
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otkxf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();

        // Data base collection
        const productsCollection = client.db('Aruth').collection('products');
        const usersCollection = client.db('Aruth').collection('users');

        
        /*==========================================
                Products API 
        ============================================*/ 

        // get popular products
        app.get('/popular-products', async(req, res)=>{
            const allPopularProducts =  productsCollection.find({popular : true});
            const skip = allPopularProducts.length - 5;
            const latestProducts = await  allPopularProducts.skip(skip).toArray();
            const reverse = latestProducts.reverse();
           res.send(reverse)
        });

        // get product info by id 
        app.get('/product-details/:id', async(req, res)=>{
            const {id} = req.params;
            const product = await productsCollection.findOne({_id : ObjectId(id)})
            res.send(product)
        });


         /*==========================================
                Login & Register
        ============================================*/ 

        //  send Token after login
        app.put('/login', async(req, res) =>{
            const {email} = req.query;
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {
                expiresIn : '1y'
            });

            res.send({token});
        });

        // Register
        app.post('/register', async(req, res)=>{
            const userDoc = req.body;
            const result = await usersCollection.insertOne(userDoc);
            // const token = jwt.sign({email})

            res.send(result);
        });
    }
    finally{

    }
}

run().catch(console.dir);

app.listen(PORT, ()=>{
    console.log('The app is running');
})