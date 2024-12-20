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
        calendar: { query: "SELECT ApptID, ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority, TradeID, CheckID FROM tblAppointments ORDER BY ApptStart DESC", title: "Calendar Database" },

        expenses: { query: "SELECT VoucherLineT.VoucherLineID, VoucherT.VoucherID, VoucherT.VoucherDate, VoucherTypeT.VoucherType, AccountDetailT.AccountName, AccountTypeT.AccountType, VoucherLineT.DebitAmount, VoucherLineT.CreditAmount,    VoucherLineT.Narration, VoucherLineT.Notes, VoucherLineT.IsExported FROM VoucherLineT INNER JOIN VoucherT ON VoucherLineT.fVoucherID = VoucherT.VoucherID JOIN VoucherTypeT ON VoucherT.fVoucherType = VoucherTypeT.VoucherTypeID JOIN AccountDetailT ON VoucherLineT.fAccountDetail = AccountDetailT.AccountDetailID JOIN AccountTypeT ON VoucherlineT.fAccountType = AccountTypeT.AccountTypeID ORDER BY VoucherT.VoucherID DESC, VoucherT.VoucherDate", title: "Expenses" },

        all_trades: { query: "SELECT tradelinet.TradeLineID, tradelinet.TradeID, tradet.BuyDate, tradetypet.TradeType, tradelinet.BuyQty, tradelinet.BuyPrice, tradelinet.SellPrice, tradelinet.Brokerage,tradelinet.DepositWithdrawal, (SellPrice * BuyQty)-(BuyPrice * BuyQty) - Brokerage AS GrossProfit, SellPrice - BuyPrice AS Pips, tradelinet.SellDate, tradelinet.Note FROM tradelinet INNER JOIN tradet ON tradelinet.TradeID = tradet.TradeID JOIN brokert ON tradelinet.BrokerID = brokert.BrokerID JOIN tradetypet ON tradelinet.TradeTypeID = tradetypet.TradeTypeID JOIN scripnamet ON tradelinet.ScripID = scripnamet.ScripID ORDER BY tradelinet.TradeID DESC", title: "All Trades" },

        profit_loss: { query: "SELECT * FROM combined_profit_loss", title: "Profit & Loss" },
        liabilities: { query: "SELECT * FROM liability_entry", title: "Liabilities" },
        
        passwords: { query: "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEMail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain ORDER BY WebsiteID DESC", title: "Passwords" }
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
