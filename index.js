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

// Add the formatDate function here
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
// Redirect root route to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ======================= Home Page =================
app.get("/home", (req, res) => {
    res.render("home");
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

        demat: { query: "SELECT BuyDate, sum_qty, sum_pips, sum_profit, sum_deposit, sum_brokerage, run_demat, run_deposit, run_pips, run_brokerage FROM demat_holding", title: "Demat" },

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

                // Format Date for all rows
                database.forEach(row => {
                    if (row.ApptStart) row.ApptStart = formatDate(row.ApptStart);
                    if (row.VoucherDate) row.VoucherDate = formatDate(row.VoucherDate);
                    if (row.BuyDate) row.BuyDate = formatDate(row.BuyDate);
                });               

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
//=========================Calendar ========================================
// Render calendar table with Insert and Edit actions
app.get("/calendar", (req, res) => {
    const query = "SELECT ApptID, ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority FROM tblAppointments ORDER BY ApptStart DESC";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        // Format BuyDate for all rows
        database.forEach(row => {
            if (row.ApptStart) row.ApptStart = formatDate(row.ApptStart);
            if (row.ApptEnd) row.ApptEnd = formatDate(row.ApptEnd);
        });

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
                if (data.ApptStart) data.ApptStart = formatDate(data.ApptStart);
                if (data.ApptEnd) data.ApptEnd = formatDate(data.ApptEnd);

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

//===============================Documents=========================================
// Render document table with Insert and Edit actions
app.get("/document", (req, res) => {   
    
    const query = "SELECT DocID, DocUserName, DocName, DocPath, DocText FROM DocT JOIN DocUserT ON DocT.DocUserID = DocUserT.DocUserID ORDER BY DocID DESC";   

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        res.render("document", { database });
    });
        
});

const fs = require("fs");

// Route to handle "Open" action
app.get("/document/open/:id", (req, res) => {
    const { id } = req.params;

    const query = "SELECT DocPath FROM DocT WHERE DocID = ?";
    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error("Error fetching document path:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (results.length > 0) {
            const filePath = results[0].DocPath;

            // Verify file exists
            const fullPath = path.resolve(filePath);
            fs.access(fullPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error("File not found:", fullPath);
                    return res.status(404).send("File not found.");
                }

                // Send the file to the client
                res.download(fullPath, path.basename(fullPath), (err) => {
                    if (err) {
                        console.error("Error sending file:", err);
                        res.status(500).send("Error serving file.");
                    }
                });
            });
        } else {
            res.status(404).send("Document not found.");
        }
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
            // Default values for the form
            const defaultData = {                
                DocUserID: users[0]?.DocUserID || 1 // Default TradeTypeID
            };
            res.render("document_form", { action, data: defaultData, users });            
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


//===============================Trades=========================================
// Render trade table with Insert and Edit actions
app.get("/trade", (req, res) => {
    const query = "SELECT tradelinet.TradeLineID, tradelinet.TradeID, tradet.BuyDate, tradetypet.TradeType, tradelinet.BuyQty, tradelinet.BuyPrice, tradelinet.SellPrice, tradelinet.Brokerage,tradelinet.DepositWithdrawal, (SellPrice * BuyQty)-(BuyPrice * BuyQty) - Brokerage AS GrossProfit, SellPrice - BuyPrice AS Pips, tradelinet.SellDate, tradelinet.Note FROM tradelinet INNER JOIN tradet ON tradelinet.TradeID = tradet.TradeID JOIN brokert ON tradelinet.BrokerID = brokert.BrokerID JOIN tradetypet ON tradelinet.TradeTypeID = tradetypet.TradeTypeID JOIN scripnamet ON tradelinet.ScripID = scripnamet.ScripID ORDER BY tradelinet.TradeID DESC";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        // Format BuyDate for all rows
        database.forEach(row => {
            if (row.BuyDate) row.BuyDate = formatDate(row.BuyDate);
            if (row.SellDate) row.SellDate = formatDate(row.SellDate);
        });

        res.render("trade", { database });
    });
});

app.get("/trade/:action/:id?", (req, res) => {
    const { action, id } = req.params;

    const brokerQuery = "SELECT BrokerID, BrokerName FROM brokert";
    const scripQuery = "SELECT ScripID, ScripName FROM scripnamet";
    const typeQuery = "SELECT TradeTypeID, TradeType FROM tradetypet";
    const tradeIDQuery = "SELECT TradeID FROM tradet ORDER BY TradeID DESC LIMIT 1";

    connection.query(brokerQuery, (err, brokers) => {
        if (err) {
            console.error("Error fetching brokers for combo box:", err);
            return res.status(500).send("Internal Server Error");
        }

        connection.query(scripQuery, (err, scrips) => {
            if (err) {
                console.error("Error fetching scrips for combo box:", err);
                return res.status(500).send("Internal Server Error");
            }

            connection.query(typeQuery, (err, types) => {
                if (err) {
                    console.error("Error fetching trade types for combo box:", err);
                    return res.status(500).send("Internal Server Error");
                }

                if (action === "edit" && id) {
                    const editQuery = `
                    SELECT TradeLineID, TradeID, BrokerID, ScripID, TradeTypeID, BuyQty, BuyPrice, SellPrice, Brokerage, DepositWithdrawal, SellDate, Note 
                    FROM TradeLineT 
                    WHERE TradeLineID = ?`;
                    connection.query(editQuery, [id], (err, database) => {
                        if (err) {
                            console.error("Error fetching data for edit:", err);
                            return res.status(500).send("Internal Server Error");
                        }

                        if (database.length > 0) {
                            const data = database[0];
                            if (data.BuyDate) data.BuyDate = formatDate(data.BuyDate);
                            if (data.SellDate) data.SellDate = formatDate(data.SellDate);
                            res.render("trade_form", { action, data, brokers, scrips, types });
                        } else {
                            res.status(404).send("Record not found.");
                        }
                    });
                } else if (action === "insert") {
                    connection.query(tradeIDQuery, (err, result) => {
                        if (err) {
                            console.error("Error fetching latest TradeID:", err);
                            return res.status(500).send("Internal Server Error");
                        }

                        const latestTradeID = result.length > 0 ? result[0].TradeID : 0;
                        const nextTradeID = latestTradeID;

                        // Default values for the form
                        const defaultData = {
                            TradeID: nextTradeID, // Auto-populated TradeID
                            BrokerID: brokers[5]?.BrokerID || 1, // Default BrokerID
                            ScripID: scrips[24]?.ScripID || 1,    // Default ScripID
                            TradeTypeID: types[0]?.TradeTypeID || 1 // Default TradeTypeID
                        };

                        res.render("trade_form", { action, data: defaultData, brokers, scrips, types });
                    });
                } else {
                    res.status(400).send("Invalid action.");
                }
            });
        });
    });
});

// Route to handle Insert/Update logic
app.post("/trade/:action/:id?", (req, res) => {   

    const { action, id } = req.params;
    const { BuyQty, BrokerID, ScripID, TradeTypeID, Brokerage, BuyPrice, SellPrice, DepositWithdrawal, Note, SellDate, TradeID } = req.body;

    if (action === "insert") {
        const query = "INSERT INTO tradelinet (BuyQty, BrokerID, ScripID, TradeTypeID,Brokerage, BuyPrice, SellPrice, DepositWithdrawal, Note, SellDate, TradeID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const values = [BuyQty, BrokerID, ScripID, TradeTypeID, Brokerage, BuyPrice, SellPrice, DepositWithdrawal, Note, SellDate, TradeID];        

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/trade/insert");
        });
    } else if (action === "edit" && id) {
        const updateQuery = `
        UPDATE TradeLineT, tradet
        SET 
            TradeLineT.TradeID = ?, 
            BrokerID = ?,             
            ScripID = ?, 
            TradeTypeID = ?, 
            BuyQty = ?, 
            BuyPrice = ?, 
            SellPrice = ?, 
            Brokerage = ?, 
            DepositWithdrawal = ?, 
            SellDate = ?, 
            Note = ?
        WHERE TradeLineT.TradeID = TradeT.TradeID AND TradeLineID = ?`;

        const values = [
            TradeID, BrokerID, ScripID, TradeTypeID, 
            BuyQty, BuyPrice, SellPrice, Brokerage, 
            DepositWithdrawal, SellDate, Note, id
        ];        

        connection.query(updateQuery, values, (err) => {            

            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/trade");
        });
    } else {
        res.status(400).send("Invalid action.");
    }
});

//===============================Trade ID Generate=======================================
// Render tradeid table with Insert and Edit actions
app.get("/tradeid", (req, res) => {
    const query = "SELECT TradeID, BuyDate From tradet ORDER BY TradeID DESC";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        // Format BuyDate for all rows
        database.forEach(row => {
            if (row.BuyDate) row.BuyDate = formatDate(row.BuyDate);
        });

        res.render("tradeid", { database });
    });
});

// Route to render Insert/Edit form with combo box
app.get("/tradeid/:action/:id?", (req, res) => {
    const { action, id } = req.params;
    if (action === "edit" && id) {
        const editQuery = `
        SELECT TradeID, BuyDate 
        FROM tradet 
        WHERE TradeID = ?`;
        connection.query(editQuery, [id], (err, database) => {
            if (err) {
                console.error("Error fetching data for edit:", err);
                return res.status(500).send("Internal Server Error");
            }
    
            if (database.length >= 0) {
                const data = database[0];
                // Format date for display
            if (data.BuyDate) data.BuyDate = formatDate(data.BuyDate);
                res.render("tradeid_form", { action, data });
            } else {
                res.status(404).send("Record not found.");
            }
        });
    } else if (action === "insert") {
    res.render("tradeid_form", { action, data: {} });
    } else {
    res.status(400).send("Invalid action.");
    }           
    
});

// Route to handle Insert/Update logic
app.post("/tradeid/:action/:id?", (req, res) => {
    
    const { action, id } = req.params;
    const { BuyDate } = req.body;

    if (action === "insert") {
        const query = "INSERT INTO tradet (BuyDate) VALUES (?)";
        const values = [BuyDate];
        
        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/trade/insert");
        });
    } else if (action === "edit" && id) {
        const updateQuery = `
        UPDATE tradet
        SET             
            BuyDate = ?
        WHERE TradeID = ?`;

        const values = [
            BuyDate, id
        ];
        
        connection.query(updateQuery, values, (err) => {            

            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/tradeid");
        });
    } else {
        res.status(400).send("Invalid action.");
    }
});

//===============================Finance=========================================
// Render trade table with Insert and Edit actions
app.get("/finance", (req, res) => {
    const query = "SELECT VoucherLineT.VoucherLineID, VoucherT.VoucherID, VoucherT.VoucherDate, VoucherTypeT.VoucherType, AccountDetailT.AccountName, AccountTypeT.AccountType, VoucherLineT.DebitAmount, VoucherLineT.CreditAmount, VoucherLineT.Narration, VoucherLineT.Notes, VoucherLineT.IsExported FROM VoucherLineT INNER JOIN VoucherT ON VoucherLineT.fVoucherID = VoucherT.VoucherID JOIN VoucherTypeT ON VoucherT.fVoucherType = VoucherTypeT.VoucherTypeID JOIN AccountDetailT ON VoucherLineT.fAccountDetail = AccountDetailT.AccountDetailID JOIN AccountTypeT ON VoucherlineT.fAccountType = AccountTypeT.AccountTypeID ORDER BY VoucherT.VoucherID DESC, VoucherT.VoucherDate";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        // Format BuyDate for all rows
        database.forEach(row => {
            if (row.VoucherDate) row.VoucherDate = formatDate(row.VoucherDate);            
        });

        res.render("finance", { database });
    });
});

app.get("/finance/:action/:id?", (req, res) => {    
    const { action, id } = req.params;

    const accountDetailQuery = "SELECT AccountDetailID, AccountName FROM accountdetailt";
    const accountTypeQuery = "SELECT AccountTypeID, AccountType FROM accounttypet";
    const modeQuery = "SELECT ModeID, ChkMode FROM tblchkmode";
    const voucherIDQuery = "SELECT VoucherID FROM vouchert ORDER BY VoucherID DESC LIMIT 1";
    const latestNarrationNotesQuery = `
        SELECT Narration, Notes 
        FROM VoucherLineT 
        ORDER BY VoucherLineID DESC 
        LIMIT 1
    `;

    connection.query(accountDetailQuery, (err, accountDetails) => {
        if (err) {
            console.error("Error fetching accountDetails for combo box:", err);
            return res.status(500).send("Internal Server Error");
        }

        connection.query(accountTypeQuery, (err, accountTypes) => {
            if (err) {
                console.error("Error fetching accountTypes for combo box:", err);
                return res.status(500).send("Internal Server Error");
            }

            connection.query(modeQuery, (err, modes) => {
                if (err) {
                    console.error("Error fetching modes for combo box:", err);
                    return res.status(500).send("Internal Server Error");
                }

                if (action === "edit" && id) {
                    const editQuery = `
                        SELECT 
                            VoucherLineID, 
                            VoucherID, 
                            VoucherDate, 
                            DebitAmount, 
                            CreditAmount, 
                            Narration, 
                            Notes, 
                            IsExported,
                            VoucherLineT.fAccountDetail AS AccountDetailID, 
                            VoucherLineT.fAccountType AS AccountTypeID 
                        FROM VoucherLineT
                        INNER JOIN VoucherT ON VoucherLineT.fVoucherID = VoucherT.VoucherID
                        JOIN AccountDetailT ON VoucherLineT.fAccountDetail = AccountDetailT.AccountDetailID
                        JOIN AccountTypeT ON VoucherLineT.fAccountType = AccountTypeT.AccountTypeID
                        WHERE VoucherLineID = ?`;

                    connection.query(editQuery, [id], (err, database) => {
                        if (err) {
                            console.error("Error fetching data for edit:", err);
                            return res.status(500).send("Internal Server Error");
                        }

                        if (database.length > 0) {
                            const data = database[0];
                            res.render("finance_form", { action, data, accountDetails, accountTypes, modes });
                        } else {
                            res.status(404).send("Record not found.");
                        }
                    });
                } else if (action === "insert") {
                    connection.query(voucherIDQuery, (err, voucherResult) => {
                        if (err) {
                            console.error("Error fetching latest VoucherID:", err);
                            return res.status(500).send("Internal Server Error");
                        }

                        const latestVoucherID = voucherResult.length > 0 ? voucherResult[0].VoucherID : 0;

                        connection.query(latestNarrationNotesQuery, (err, narrationNotesResult) => {
                            if (err) {
                                console.error("Error fetching latest Narration and Notes:", err);
                                return res.status(500).send("Internal Server Error");
                            }

                            const latestNarrationNotes = narrationNotesResult[0] || { Narration: "", Notes: "" };

                            // Default values for the form
                            const defaultData = {
                                VoucherID: latestVoucherID,
                                AccountDetailID: accountDetails[1]?.AccountDetailID || 1, // Default AccountDetailID
                                AccountTypeID: accountTypes[0]?.AccountTypeID || 1,    // Default AccountTypeID
                                Narration: latestNarrationNotes.Narration,            // Pre-populated Narration
                                Notes: latestNarrationNotes.Notes                     // Pre-populated Notes
                            };

                            res.render("finance_form", { action, data: defaultData, accountDetails, accountTypes, modes });
                        });
                    });
                } else {
                    res.status(400).send("Invalid action.");
                }
            });
        });
    });
});


// Route to handle Insert/Update logic
app.post("/finance/:action/:id?", (req, res) => {
    const { action, id } = req.params;
    const { AccountDetailID, AccountTypeID, DebitAmount, CreditAmount, Narration, Notes, VoucherID } = req.body;

    if (action === "insert") {
        // Query to count entries for the same VoucherID
        const checkQuery = "SELECT COUNT(*) AS count FROM VoucherLineT WHERE fVoucherID = ?";

        connection.query(checkQuery, [VoucherID], (err, results) => {
            if (err) {
                console.error("Error checking entries for VoucherID:", err);
                return res.status(500).send("Internal Server Error");
            }

            const entryCount = results[0].count;

            if (entryCount >= 2) {
                // Restrict further entries
                return res.status(400).send("Cannot add more than 2 entries for the same VoucherID.");
            }

            // Proceed with insert logic
            const query = "INSERT INTO VoucherLineT (fAccountDetail, fAccountType, DebitAmount, CreditAmount, Narration, Notes, fVoucherID, IsExported) VALUES (?, ?, ?, ?, ?, ?, ?, 0)";
            const values = [AccountDetailID, AccountTypeID, DebitAmount, CreditAmount, Narration, Notes, VoucherID];

            connection.query(query, values, (err) => {
                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).send("Internal Server Error");
                }
                res.redirect("/finance/insert");
            });
        });
    } else if (action === "edit" && id) {
        // Skip the "more than 2 entries" check for edit
        const updateQuery = `
        UPDATE VoucherLineT 
        SET fVoucherID = ?, fAccountDetail = ?, fAccountType = ?, DebitAmount = ?, CreditAmount = ?, Narration = ?, Notes = ?, IsExported = 0 
        WHERE VoucherLineID = ?`;

        const values = [
            VoucherID, AccountDetailID, AccountTypeID,
            DebitAmount, CreditAmount, Narration,
            Notes, id
        ];

        connection.query(updateQuery, values, (err) => {
            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/finance");
        });
    } else {
        res.status(400).send("Invalid action.");
    }
});



//===============================Finance ID Generate=======================================
// Render financeid table with Insert and Edit actions
app.get("/financeid", (req, res) => {
    const query = "SELECT VoucherID, VoucherDate, fVoucherType From vouchert ORDER BY VoucherID DESC";

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        // Format VoucherDate for all rows
        database.forEach(row => {
            if (row.VoucherDate) row.VoucherDate = formatDate(row.VoucherDate);
        });

        res.render("financeid", { database });
    });
});

// Route to render Insert/Edit form with combo box
app.get("/financeid/:action/:id?", (req, res) => {
    const { action, id } = req.params;

    const voucherTypeQuery = "SELECT VoucherTypeID, VoucherType FROM VoucherTypeT";
    connection.query(voucherTypeQuery, (err, voucherTypes) => {
        if (err) {
            console.error("Error fetching voucherTypes for combo box:", err);
            return res.status(500).send("Internal Server Error");
        }
        if (action === "edit" && id) {
            const editQuery = `
            SELECT VoucherID, VoucherDate, fVoucherType AS VoucherTypeID 
            FROM vouchert 
            WHERE VoucherID = ?`;
            connection.query(editQuery, [id], (err, database) => {
                if (err) {
                    console.error("Error fetching data for edit:", err);
                    return res.status(500).send("Internal Server Error");
                }

                if (database.length > 0) {
                    const data = database[0];
                    if (data.VoucherDate) data.VoucherDate = formatDate(data.VoucherDate);
                    res.render("financeid_form", { action, data, voucherTypes });
                } else {
                    res.status(404).send("Record not found.");
                }
            });
        } else if (action === "insert") {
            const defaultData = {};
            res.render("financeid_form", { action, data: defaultData, voucherTypes });
        } else {
            res.status(400).send("Invalid action.");
        }
    });
});


// Route to handle Insert/Update logic
app.post("/financeid/:action/:id?", (req, res) => {
    const { action, id } = req.params;
    const { VoucherDate, VoucherTypeID } = req.body; // Use correct form field names

    if (action === "insert") {
        const query = "INSERT INTO vouchert (VoucherDate, fVoucherType) VALUES (?, ?)";
        const values = [VoucherDate, VoucherTypeID];
        
        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/finance/insert");
        });
    } else if (action === "edit" && id) {
        const updateQuery = `
        UPDATE vouchert
        SET VoucherDate = ?, fVoucherType = ? 
        WHERE VoucherID = ?`;

        const values = [VoucherDate, VoucherTypeID, id];
        
        connection.query(updateQuery, values, (err) => {
            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/financeid");
        });
    } else {
        res.status(400).send("Invalid action.");
    }
});

//===============================Calculator===================================
// Route for the calculator
app.get('/calculator', (req, res) => {
    res.render('calculator');
});

//=============================Login===========================================
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: null });
});

// ======================= Handle Login =================
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM tblusers WHERE UserName = ? AND Password = ?';
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            // Successful login, redirect to home page
            res.redirect('/home');
        } else {
            // Invalid credentials, show login page with an error message
            res.render('login', { errorMessage: 'Invalid username or password' });
        }
    });
});


//=======================================Logout===============================

// Route to render the login page
app.get('/logout', (req, res) => {
    res.redirect('/login'); // Redirect to login page
});

//===================================Password==================================
// Render document table with Insert and Edit actions
app.get("/password", (req, res) => {   
    
    const query = "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain ORDER BY WebsiteID DESC";   

    connection.query(query, (err, database) => {
        if (err) return res.status(500).send("Internal Server Error");

        res.render("password", { database });
    });
        
});

// Route to render Insert/Edit form
app.get("/password/:action/:id?", (req, res) => {
    const { action, id } = req.params;

    if (action === "edit" && id) {
        // Fetch the specific record for editing
        const query = "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain WHERE WebsiteID = ?";
        connection.query(query, [id], (err, database) => {
            if (err) {
                console.error("Error fetching data for edit:", err);
                return res.status(500).send("Internal Server Error");
            }

            if (database.length > 0) {
                const data = database[0];               

                res.render("password_form", { action, data });
            } else {
                res.status(404).send("Record not found.");
            }
        });
    } else if (action === "insert") {
        res.render("password_form", { action, data: {} });
    } else {
        res.status(400).send("Invalid action.");
    }
});

// Route to handle Insert/Update logic
app.post("/password/:action/:id?", (req, res) => {
    const { action, id } = req.params;
    const { WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2 } = req.body;

    if (action === "insert") {
        // Insert new record
        const query = `INSERT INTO tblWebsiteMain (WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2];

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/password");
        });
    } else if (action === "edit" && id) {
        // Update existing record
        const query = `UPDATE tblWebsiteMain SET WebsiteName = ?, UserName = ?, Password = ?, LinkedEmail = ?, LinkedMobile = ?, Note1 = ?, Note2 = ? WHERE WebsiteID = ?`;
        const values = [WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2, id];

        connection.query(query, values, (err) => {
            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/password");
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
