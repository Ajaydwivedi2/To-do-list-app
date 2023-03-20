
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
 
  // Define schema
  const itemsSchema = {
    name: String
  };

  // Define model
  const Item = mongoose.model('Item', itemsSchema);

  // Defining Documents
  const item1 = new Item({
    name: "Welcome to your todolist!"
  });
  const item2 = new Item({
    name: "Hit the + button to add a new item."
  });
  const item3 = new Item({
    name: "<-- Hit this to delete an item."
  });

  const defaultItems = [item1, item2, item3];

  //Define customlist schema 
  const listSchema = {
    name: String,
    items: [itemsSchema]
  };

  // Define customlist Model
  const List = mongoose.model('List', listSchema);

  app.get("/", function (req, res) {

    Item.find({}).then(function (foundItems) {

      if (foundItems.length === 0) {

        Item.insertMany(defaultItems).then(function () {

          console.log("Successfully saved default items to DB");

        }).catch(function (err) {
          console.log(err);
        });
        res.redirect('/')
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }

    })
      .catch(function (err) {
        console.log(err);
      });

  });

  app.get('/:customListName', function (req, res) {

    if (req.params.customListName === "favicon.ico") return;

    const customListName = _.capitalize(req.params.customListName);

    if (customListName === "Today") {
      res.redirect('/')
    } else {

      List.findOne({ name: customListName }).then(function (findItems) {

        if (findItems === null) {
          // create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          })
          list.save().then(function(){

            res.redirect('/' + customListName);
          })

        } else {
          // show an existing list
          res.render("list", { listTitle: findItems.name, newListItems: findItems.items });
        }

      }).catch(function (err) {
        console.log(err);
      });
    }
  });


  app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const customListName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (customListName === "Today") {
      item.save().then(function(){

        res.redirect('/')
      });
    } else {
      List.findOne({ name: customListName }).then(function (findList) {

        findList.items.push(item);
        findList.save().then(function(){
          
          res.redirect('/' + customListName);
        });

      }).catch(function (err) {
        console.log(err);
      });
    }

  });

  app.post('/delete', function (req, res) {

    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {

      Item.findByIdAndRemove(checkedItem).then(function () {
        console.log("Successfully deleted checked item");
        res.redirect('/')
      }).catch(function (err) {
        console.log(err);
      });
    } else {
      List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItem } } }).then(function () {
        res.redirect('/' + listName);
      })
        .catch(function (err) {
          console.log(err);
        });
    }
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });
}
app.listen(process.env.PORT||3000, function () {
  console.log("Server started on port 3000");
});

