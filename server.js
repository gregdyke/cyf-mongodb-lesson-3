const express = require("express");
const mongodb = require("mongodb");
const config = require("config");
const _ = require("lodash");

const uri = config.dbhost;
const mongoOptions = { useUnifiedTopology: true }

const app = express();
app.use(express.json());

app.get("/listings", function (request, response) {
  const client = new mongodb.MongoClient(uri, mongoOptions);

  client.connect(function () {
    const db = client.db("sample_airbnb");
    const collection = db.collection("listingsAndReviews");
    
    const listingsQuery = {
      room_type: request.query.room_type,
      "address.country": request.query.country,
      "address.street": request.query.street
    };

    if (request.query.guests_min !== undefined) {
      listingsQuery.accommodates = {
	$lte: Number(request.query.guests_max), 
	$gte: Number(request.query.guests_min)
      };
    }

    if (request.query.amenities !== undefined) {
      listingsQuery.amenities = {
	$all: request.query.amenities.split(",")
      };
    }

    collection.find(listingsQuery, {projection:{name:1, address:1, amenities:1, accommodates:1}}).toArray(function (error, results) {
      if (error) {
	response.status(500, error);
      } else {
	response.send(results);//.map(result => _.pick(result,["name", "address.country"])));
      }
      client.close();
    });
  });
});

app.listen(3000);
