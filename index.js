// // ================ BASIC SETUP =================

let express = require ("express");
const app = express();
const port = 8080;
const {v4 : uuidv4} = require ("uuid");
const methodOverride = require ("method-override");
const path = require("path");

// new additions
const mysql = require ("mysql2");
// connection to database
const connection = mysql.createConnection({
    host : "localhost",
    user : "root",
    database : "universalportfolio",
    password : "&&Alok&&24"
});


app.use(methodOverride("_method"));

app.use(express.urlencoded({extended : true}));

app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

app.set(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));


app.listen(port, () => {
    console.log("App is listening on port : 8080")
});

// //  =============================================

// ======================= homepage =================
app.get("/",(req,res) =>{
    res.render("home")
});


// =================== view route ===================
app.get("/user/calendar", (req,res) => {

    let q = 'SELECT * FROM calendar';

    try {
        connection.query(q,(err,database) => {
            if (err) throw err;
            res.render("calendar.ejs",{database});
            
        });
        
    } catch (err) {
        console.log(err);
    }
});


// ===================== update route ================
// 1. form from GET request
// 2. update from PATCH request

app.get("/user/calendar/edit", (req,res) => {
    res.render("edit.ejs");
});

app.patch("/user", (req,res) => {


});
