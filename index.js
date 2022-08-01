const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// default route
app.get('/', (req, res)=>{
    res.send("The server is running")
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otkxf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        
        /*==========================================
                Products API 
        ============================================*/ 
        const productCollection = client.db('Aruth').collection('products');

        // get popular products
        app.get('/popular-products', async(req, res)=>{
            const allPopularProducts =  productCollection.find({popular : true});
            const skip = allPopularProducts.length - 5;
            const latestProducts = await  allPopularProducts.skip(skip).toArray();
            const reverse = latestProducts.reverse();
           res.send(reverse)
        });

        // get product info by id 
        app.get('/product-details/:id', async(req, res)=>{
            const {id} = req.params;
            const product = await productCollection.findOne({_id : id})
            res.send(id)
        });

    }
    finally{

    }
}

run().catch(console.dir);

app.listen(PORT, ()=>{
    console.log('The app is running');
})