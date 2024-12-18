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

//===================Dynamic Loop to render Template.ejs file====================
app.get("/user/:page", (req, res) => {
    const { page } = req.params;

    // Map of pages to their queries and titles
    const pageMap = {
        calendar: { query: "SELECT * FROM calendar", title: "Calendar Database" },
        expenses: { query: "SELECT * FROM run_expenses_entry", title: "Expenses" },
        all_trades: { query: "SELECT * FROM daily_consolidated", title: "All Trades" },
        profit_loss: { query: "SELECT * FROM combined_profit_loss", title: "Profit & Loss" },
        liabilities: { query: "SELECT * FROM liability_entry", title: "Liabilities" },
        passwords: { query: "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEMail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain", title: "Passwords" }
    };

    const pageDetails = pageMap[page];

    if (pageDetails) {
        try {
            connection.query(pageDetails.query, (err, database) => {
                if (err) throw err;

                // Render the single template file and pass data
                res.render("template.ejs", { database, title: pageDetails.title });
            });
        } catch (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.status(404).send("Page Not Found");
    }
});

//================Git Commands =================
//git clone link to the repository
//git status
//git add .
//git commit -m "changes made"
//git push origin main

//=================Terminal Commands=========================
//nodemon
//Ctrl+C - It kills the server 

// ===================== update route ================
// 1. form from GET request
// 2. update from PATCH request

// app.get("/user/calendar/edit", (req,res) => {
//     res.render("edit.ejs");
// });

// app.patch("/user", (req,res) => {
    
// });
