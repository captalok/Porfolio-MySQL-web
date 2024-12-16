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
    database : "portfoliomysql",
    password : "&&Alok&&24"
});


app.use(methodOverride("_method"));

app.use(express.urlencoded({extended : true}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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

app.get("/user/expenses", (req,res) => {

    let q = 'SELECT * FROM run_expenses_entry;';

    try {
        connection.query(q,(err,database) => {
            if (err) throw err;
            res.render("expenses.ejs",{database});
            
        });
        
    } catch (err) {
        console.log(err);
    }
});

app.get("/user/all_trades", (req,res) => {

    let q = 'SELECT * FROM all_trades;';

    try {
        connection.query(q,(err,database) => {
            if (err) throw err;
            res.render("all_trades.ejs",{database});
            
        });
        
    } catch (err) {
        console.log(err);
    }
});

app.get("/user/profit_loss", (req,res) => {

    let q = 'SELECT * FROM combined_profit_loss;';

    try {
        connection.query(q,(err,database) => {
            if (err) throw err;
            res.render("ProfitLoss.ejs",{database});
            
        });
        
    } catch (err) {
        console.log(err);
    }
});
//================Git Commands =================
//git clone link to the repository
//git status
//git push .
//git commit -m"changes made"
//git push origin main

//=================Terminal Commands=========================
//nodemon 

// ===================== update route ================
// 1. form from GET request
// 2. update from PATCH request

// app.get("/user/calendar/edit", (req,res) => {
//     res.render("edit.ejs");
// });

// app.patch("/user", (req,res) => {
    
// });
