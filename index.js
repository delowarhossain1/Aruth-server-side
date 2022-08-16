const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());
app.use(cors());

// default route
app.get("/", (req, res) => {
  res.send("The server is running");
});

/*
  ==========================
   JSON web token ( verify token) 
   ===========================
*/ 
function verifyToken(req, res, next) {
  const authorization = req.headers.auth;
  const email = req.query.email;

  if (!authorization) {
    return res.status(401).send({ message: "Unauthorize access" });
  }
  // get access token from a sting;
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    } else {
      // Check access token email & api requested email;
      if(decoded.email === email){
        return next();
      }
      else{
        return send.status(403).send({message : 'Forbidden access'});
      }
    }
  });
}

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otkxf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    // Data base collection
    const productsCollection = client.db("Aruth").collection("products");
    const usersCollection = client.db("Aruth").collection("users");
    const OrderCollection = client.db("Aruth").collection("orders");

    /*=============================================
           ************** Products API ***********
        ============================================*/

    // get popular products
    app.get("/popular-products", async (req, res) => {
      const allPopularProducts = productsCollection.find({ popular: true });
      const skip = allPopularProducts.length - 5;
      const latestProducts =  allPopularProducts.skip(skip).project({
        img : 1,
        name : 1, 
        ratings : 1, 
        price : 1, 
        discount: 1,
      });
      const exactProduct = await latestProducts.toArray();
      const reverse = exactProduct.reverse();
      res.send(reverse);
    });

    // Just for you
    app.get('/just-for-you', async(req, res)=>{

    });

    // Get all products
    app.get('/all-products', async(req, res)=>{
        const result = await productsCollection.find().toArray();
        const latestProduct = result.reverse();
        res.send(latestProduct);
    });

    // get product info by id
    app.get("/product-details/:id", async (req, res) => {
      const { id } = req.params;
      const product = await productsCollection.findOne({ _id: ObjectId(id) });
      res.send(product);
    });

    /*==========================================
          ********* Order management **********
        ============================================*/

    // place order
    app.post("/place-order", verifyToken, async (req, res) => {
      const ordersInfo = req.body;
      const result = await OrderCollection.insertOne(ordersInfo);
      res.send(result);

    });

    /*==========================================
          ******** Login & Register *******
        ============================================*/

    //  send Token after login
    app.get("/access-token", async (req, res) => {
      const { email } = req.query;
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1y",
      });

      res.send({ token });
    });

    // Register
    app.put("/register", async (req, res) => {
      const email = req.query.email;
      const userDoc = { $set: req.body };
      const query = { email };
      const option = { upsert: true };
      const result = await usersCollection.updateOne(query, userDoc, option);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log("The app is running");
});
