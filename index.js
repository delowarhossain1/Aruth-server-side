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
  ===========================================
    *** JSON web token ( verify token) ***
   ===========================================
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
      if (decoded.email === email) {
        return next();
      } else {
        return send.status(403).send({ message: "Forbidden access" });
      }
    }
  });
}

/*======================================================================================*/
/*======================================================================================*/
/*======================================================================================*/
/*======================================================================================*/

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
    const productCollection = client.db("Aruth").collection("products");
    const usersCollection = client.db("Aruth").collection("users");
    const orderCollection = client.db("Aruth").collection("orders");

    /*===========================================
        *** Verify admin ***
===========================================*/

    const verifyAdmin = async (req, res, next) => {
      const email = req.query.email;
      const query = { email };
      const user = await usersCollection.findOne(query);

      if (user?.role === "admin") {
        return next();
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    };

    /*=============================================
           ************** Products API ***********
        ============================================*/

    // get popular products
    app.get("/popular-products", async (req, res) => {
      const allPopularProducts = productCollection.find({ popular: true });
      const skip = allPopularProducts.length - 5;
      const latestProducts = allPopularProducts.skip(skip).project({
        img: 1,
        name: 1,
        ratings: 1,
        price: 1,
        discount: 1,
      });
      const exactProduct = await latestProducts.toArray();
      const reverse = exactProduct.reverse();
      res.send(reverse);
    });

    // Just for you
    app.get("/just-for-you", async (req, res) => {});

    // Get all products
    app.get("/all-products", async (req, res) => {
      const result = await productCollection.find().toArray();
      const latestProduct = result.reverse();
      res.send(latestProduct);
    });

    // get product info by id
    app.get("/product-details/:id", async (req, res) => {
      const { id } = req.params;
      const product = await productCollection.findOne({ _id: ObjectId(id) });
      res.send(product);
    });

          /*********** Admin control ***********/ 
   
    // get our available products
    app.get('/products', verifyToken, verifyAdmin, async(req, res)=>{
      const product = await productCollection.find().project({
        img : 1,
        name : 1,
        price : 1,
        totalSells : 1,
        couponCode : 1,
      }).toArray();

      const latestProduct = product.reverse();
      res.send(latestProduct);
    });

    // product details
    app.get('/product-explore/:id', verifyToken, verifyAdmin, async(req, res)=>{
      const {id} = req.params;
      const product = await productCollection.findOne({_id : ObjectId(id)});
      res.send(product);
    })

    /*==========================================
          ********* Order management **********
        ============================================*/

    // place order
    app.post("/place-order", verifyToken, async (req, res) => {
      const ordersInfo = req.body;
      const totalOrders = await orderCollection.estimatedDocumentCount();

      // make order number
      const orderNum = `AR${require("crypto")
        .randomBytes(2)
        .toString("hex")}C${totalOrders}`;
      const doc = { ...ordersInfo, orderNum };

      const result = await orderCollection.insertOne(doc);
      res.send(result);
    });

    // ************ Admin control *******

    app.get("/orders", verifyToken, verifyAdmin, async (req, res) => {
      const orders = await orderCollection
        .find()
        .project({
          _id: 1,
          productImg: 1,
          productName: 1,
          productQuantity: 1,
          status: 1,
          date: 1,
        })
        .toArray();
      const recentOrders = orders.reverse();
      res.send(recentOrders);
    });

    // Order details
    app.get(
      "/order-details/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const query = { _id: ObjectId(id) };
        const order = await orderCollection.findOne(query);
        res.send(order);
      }
    );

    // update order status
    app.patch(
      "/update-order-info/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const updatedInfo = req.body;
        const result = await orderCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: updatedInfo }
        );
        res.send(result);
      }
    );

    // Order delete
    app.delete(
      "/order-delete/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const result = await orderCollection.deleteOne({ _id: ObjectId(id) });
        res.send(result);
      }
    );

    // Search order by order number
    app.get("/search-order/:id", verifyToken, verifyAdmin, async (req, res) => {
      console.log("jio");
      const id = req.params.id;
      const result = await orderCollection
        .find({ orderNum: id })
        .project({
          _id: 1,
          productImg: 1,
          productName: 1,
          productQuantity: 1,
          status: 1,
          date: 1,
        })
        .toArray();
      res.send(result);
    });

    /*============================================================
          ******** Login & Register ( User management) *******
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

    // make user
    app.patch("/make-admin", async (req, res) => {});

    // is admin
    app.get("/is-admin/:email", async (req, res) => {
      const { email } = req.params;
      const user = await usersCollection.findOne({ email });

      if (user?.role === "admin") {
        res.send({ isAdmin: true });
      } else {
        res.send({ isAdmin: false });
      }
    });
  } finally {
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log("The app is running");
});
