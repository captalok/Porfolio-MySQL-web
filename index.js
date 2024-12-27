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
        calendar: { query: "SELECT ApptID, ApptSubject, ApptLocation, ApptStart, ApptNotes FROM tblAppointments ORDER BY ApptStart DESC", title: "Calendar Database" },

        expenses: { query: "SELECT VoucherDate, AccountName, AccountType, DebitAmount, CreditAmount, Narration from run_expenses_entry", title: "Expenses" },

        all_trades: { query: "SELECT * from daily_trades", title: "All Trades" },

        daily_consolidated: { query: "SELECT * from daily_consolidated", title: "Daily Trades" },

        mly_trades: { query: "SELECT Trade_year,Trade_Month, profit, sBrokerage, sPips, sDepositWithdrawal from mly_trades", title: "Monthly Trades" },

        yearly_trades: { query: "SELECT * from yearly_trades", title: "Yearly Trades" },

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

// ======================= Dashboard =================
app.get("/dashboard", (req, res) => {
    try {
        // Fetch required data for charts
        const queries = {
            profitLoss: "SELECT Trade_Year, Profit, Loss FROM combined_profit_loss",
            monthlyTrades: "SELECT Trade_Year, profit FROM mly_trades",
            yearlyTrades: "SELECT Trade_Year, profit, sDepositWithdrawal FROM yearly_trades",
            expenses: "SELECT AccountName, amt_spent FROM sum_account_name WHERE AccountName IN('Household Items', 'Bills', 'Education', 'Telecom', 'Travel', 'GIC Loan', 'Purchases', 'Mess Bill', 'LPG Gas', 'Gifts', 'Food and Drinks', 'Credit Card', 'Shopping Mall', 'Card Fee', 'Entertainment', 'Electricity', 'Spiritual', 'Health', 'Fuel')",
            monthlyExpenses: "SELECT Expense_Year, Expenses FROM mly_expenses WHERE Expenses < 10000000",
            liabilities: "SELECT AcctName, AmtBal FROM Demat_Expenses where AcctName IN('Bank', 'Cash', 'Wallet', 'Demat', 'Credit Card')"
        };

        const results = {};

        // Use promises to handle multiple queries
        const queryPromises = Object.keys(queries).map(key =>
            new Promise((resolve, reject) => {
                connection.query(queries[key], (err, result) => {
                    if (err) reject(err);
                    results[key] = result;
                    resolve();
                });
            })
        );

        Promise.all(queryPromises)
            .then(() => {
                //console.log(results);
                res.render("dashboard.ejs", { results });
            })
            .catch(err => {
                console.log(err);
                res.status(500).send("Internal Server Error");
            });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
});

const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Render calendar table with Insert and Edit actions
app.get("/calendar", (req, res) => {
    const query = "SELECT ApptID, ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority FROM tblAppointments ORDER BY ApptStart DESC";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        res.render("calendar", { database });
    });
});

// Route to render Insert/Edit form
app.get("/calendar/:action/:id?", (req, res) => {
    const { action, id } = req.params;

    if (action === "edit" && id) {
        // Fetch the specific record for editing
        const query = "SELECT * FROM tblAppointments WHERE ApptID = ?";
        connection.query(query, [id], (err, database) => {
            if (err) {
                console.error("Error fetching data for edit:", err);
                return res.status(500).send("Internal Server Error");
            }

            if (database.length > 0) {
                const data = database[0];

                // Format date-time fields for `datetime-local` input
                if (data.ApptStart) data.ApptStart = formatDateTime(data.ApptStart);
                if (data.ApptEnd) data.ApptEnd = formatDateTime(data.ApptEnd);

                res.render("calendar_form", { action, data });
            } else {
                res.status(404).send("Record not found.");
            }
        });
    } else if (action === "insert") {
        res.render("calendar_form", { action, data: {} });
    } else {
        res.status(400).send("Invalid action.");
    }
});

// Route to handle Insert/Update logic
app.post("/calendar/:action/:id?", (req, res) => {
    const { action, id } = req.params;
    const { ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority } = req.body;

    if (action === "insert") {
        // Insert new record
        const query = `INSERT INTO tblAppointments (ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority];

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/calendar");
        });
    } else if (action === "edit" && id) {
        // Update existing record
        const query = `UPDATE tblAppointments SET ApptSubject = ?, ApptLocation = ?, ApptStart = ?, ApptEnd = ?, ApptNotes = ?, Priority = ? WHERE ApptID = ?`;
        const values = [ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority, id];

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/calendar");
        });
    } else {
        res.status(400).send("Invalid action.");
    }
});

// Render document table with Insert and Edit actions
app.get("/document", (req, res) => {
    const query = "SELECT DocID, DocUserName, DocName, DocPath, DocText FROM DocT JOIN DocUserT ON DocT.DocUserID = DocUserT.DocUserID ORDER BY DocID DESC";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        res.render("document", { database });
    });
});

// Route to render Insert/Edit form with combo box
app.get("/document/:action/:id?", (req, res) => {
    const { action, id } = req.params;

    const comboQuery = "SELECT DocUserID, DocUserName FROM DocUserT";

    connection.query(comboQuery, (err, users) => {
        if (err) {
            console.error("Error fetching users for combo box:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (action === "edit" && id) {
            const editQuery = "SELECT DocID, DocUserID, DocName, DocPath, DocText FROM DocT WHERE DocID = ?";
            connection.query(editQuery, [id], (err, database) => {
                if (err) {
                    console.error("Error fetching data for edit:", err);
                    return res.status(500).send("Internal Server Error");
                }

                if (database.length > 0) {
                    const data = database[0];
                    res.render("document_form", { action, data, users });
                } else {
                    res.status(404).send("Record not found.");
                }
            });
        } else if (action === "insert") {
            res.render("document_form", { action, data: {}, users });
        } else {
            res.status(400).send("Invalid action.");
        }
    });
});

// Route to handle Insert/Update logic
app.post("/document/:action/:id?", (req, res) => {
    const { action, id } = req.params;
    const { DocUserID, DocName, DocPath, DocText } = req.body;

    if (action === "insert") {
        const query = "INSERT INTO DocT (DocUserID, DocName, DocPath, DocText) VALUES (?, ?, ?, ?)";
        const values = [DocUserID, DocName, DocPath, DocText];

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/document");
        });
    } else if (action === "edit" && id) {
        const query = "UPDATE DocT SET DocName = ?, DocPath = ?, DocText = ?, DocUserID = ? WHERE DocID = ?";
        const values = [DocName, DocPath, DocText, DocUserID, id];

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/document");
        });
    } else {
        res.status(400).send("Invalid action.");
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
