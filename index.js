const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;


app.get('/', (req, res)=>{
    res.send("The server is running")
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Aruth:<password>@cluster0.otkxf.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});




app.listen(PORT, ()=>{
    console.log('The app is running');
})