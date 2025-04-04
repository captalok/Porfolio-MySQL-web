// ==================== BASIC SETUP ====================
const express = require("express");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");
const path = require("path");
const mysql = require("mysql2/promise");
const ip = require("ip"); // Import the ip package

const app = express();
const port = 8080;

// Get the local network IP automatically
const localIP = ip.address();
console.log(`Detected Server IP: ${localIP}`);

// Database connection details
const hosts = [
    { host: "localhost", user: "root", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.1", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.2", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.3", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.4", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.5", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.6", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.7", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.8", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.9", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.10", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.11", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" }, 
    { host: "192.168.1.12", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.13", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.14", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" },
    { host: "192.168.1.15", user: "admin", database: "portfoliomysql", password: "&&Alok&&24" }
];

async function connectToDatabase() {
    for (let i = 0; i < hosts.length; i++) {
        try {
            //console.log(`Trying to connect to ${hosts[i].host}...`);
            const connection = await mysql.createConnection(hosts[i]);
            //console.log(`Connected to MySQL at ${hosts[i].host}`);
            return connection;
        } catch (err) {
            console.error(`Connection to ${hosts[i].host} failed: ${err.message}`);
        }
    }
    throw new Error("All database connections failed.");
}

// Start the Express server and listen on all network interfaces
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server is running on:`);
    console.log(`➡ Local:   http://localhost:${port}`);
    console.log(`➡ Network: http://${localIP}:${port}`);
});


// Middleware
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==================== SESSION SETUP ====================
app.use(
    session({
        secret: uuidv4(), // Generate a unique secret key
        resave: false, // Do not save session if not modified
        saveUninitialized: false, // Do not create session until something stored
        cookie: { secure: false, maxAge: 1000 * 60 * 60 }, // 1-hour expiration
    })
);

// ==================== HELPER FUNCTION ====================
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==================== AUTH MIDDLEWARE ====================
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      // User is authenticated
      return next();
    } else {
      // User is not authenticated; redirect to login page
      res.redirect('/login');
    }
  } 

// ==================== ROUTES ====================
// Redirect root to login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Login Page
app.get("/login", (req, res) => {
    if (req.session.isAuthenticated) {
        return res.redirect("/home");
    }
    res.render("login", { errorMessage: null });
});

// Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await connectToDatabase();
        const query = 'SELECT * FROM tblusers WHERE UserName = ? AND Password = ?';
        const [results] = await connection.execute(query, [username, password]);

        if (results.length > 0) {
            req.session.user = { username: results[0].UserName }; // Set user in session
            res.redirect('/home');
        } else {
            res.render('login', { errorMessage: 'Invalid username or password' });
        }

        connection.end(); // Close the database connection
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});
  

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect('/login');
    });
});
  

// Home Page (Protected Route)
app.get("/home", isAuthenticated, (req, res) => {
    res.render("home", { username: req.session.user.username });
});
  

// Dynamic Loop to render templates (Protected Route)
app.get("/user/:page", isAuthenticated, async (req, res) => {
    const { page } = req.params;

    const pageMap = {
        calendar: { query: "SELECT ApptID, ApptSubject, ApptLocation, ApptStart, ApptNotes FROM tblAppointments ORDER BY ApptStart DESC", title: "Calendar Database" },
        expenses: { query: "SELECT VoucherDate, AccountName, AccountType, DebitAmount, CreditAmount, Narration from run_expenses_entry", title: "Expenses" },
        all_trades: { query: "SELECT * from daily_trades", title: "All Trades" },
        daily_consolidated: { query: "SELECT * from daily_consolidated", title: "Daily Trades" },
        demat: { query: "SELECT BuyDate, sum_qty, sum_pips, sum_profit, sum_deposit, run_demat, run_deposit, run_pips, run_brokerage FROM demat_holding", title: "Demat" },
        mly_trades: { query: "SELECT Trade_year,Trade_Month, profit, sBrokerage, sPips, sDepositWithdrawal from mly_trades", title: "Monthly Trades" },
        yearly_trades: { query: "SELECT * from yearly_trades", title: "Yearly Trades" },
        profit_loss: { query: "SELECT * FROM combined_profit_loss", title: "Profit & Loss" },
        liabilities: { query: "SELECT * FROM liability_entry", title: "Liabilities" },
        day_trade: { query: "SELECT * FROM day_trade ORDER BY Day DESC", title: "Day Trades" },
        month_trade: { query: "SELECT * FROM month_trade ORDER BY Month DESC", title: "Month Trades" },
        year_trade: { query: "SELECT * FROM year_trade ORDER BY Year DESC", title: "Year Trades" },
        passwords: { query: "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEMail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain ORDER BY WebsiteID DESC", title: "Passwords" }
    };

    const pageDetails = pageMap[page];

    if (!pageDetails) {
        return res.status(404).send("Page Not Found");
    }

    try {
        const connection = await connectToDatabase();
        const [database] = await connection.execute(pageDetails.query);

        database.forEach(row => {
            if (row.ApptStart) row.ApptStart = formatDate(row.ApptStart);
            if (row.VoucherDate) row.VoucherDate = formatDate(row.VoucherDate);
            if (row.BuyDate) row.BuyDate = formatDate(row.BuyDate);
            if (row.Day) row.Day = formatDate(row.Day);
            if (row.Month) row.Month = formatDate(row.Month);
            if (row.Year) row.Year = formatDate(row.Year);
        });

        res.render("template.ejs", { database, title: pageDetails.title });

        connection.end(); // Close connection
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});


// ==================== START SERVER ====================
app.listen(port, () => {
    console.log(`App is listening on port: ${port}`);
});


// ======================= Dashboard =================
app.get("/dashboard", isAuthenticated, async (req, res) => {
    try {
        // Fetch required data for charts
        const queries = {
            profitLoss: "SELECT Trade_Year, Profit, Loss FROM combined_profit_loss",
            monthlyTrades: "SELECT Trade_Year, profit FROM mly_trades",
            yearlyTrades: "SELECT Trade_Year, profit, sDepositWithdrawal FROM yearly_trades",
            expenses: "SELECT AccountName, amt_spent FROM sum_account_name WHERE AccountName IN('Household Items', 'Bills', 'Education', 'Telecom', 'Travel', 'GIC Loan', 'Purchases', 'Mess Bill', 'LPG Gas', 'Gifts', 'Food and Drinks', 'Credit Card', 'Shopping Mall', 'Card Fee', 'Entertainment', 'Electricity', 'Spiritual', 'Health', 'Fuel', 'Mala Expenses', 'Akash Expenses', 'Aryan Expenses', 'Maintenance', 'Grocery')",
            monthlyExpenses: "SELECT Expense_Year, Expenses FROM mly_expenses WHERE Expenses < 10000000",
            liabilities: "SELECT AcctName, AmtBal FROM Demat_Expenses WHERE AcctName IN('Bank', 'Cash', 'Wallet', 'Demat', 'Credit Card')"
        };

        const connection = await connectToDatabase();
        const results = {};

        // Execute all queries in parallel using Promise.all()
        await Promise.all(
            Object.keys(queries).map(async (key) => {
                const [rows] = await connection.execute(queries[key]);
                results[key] = rows;
            })
        );

        res.render("dashboard.ejs", { results });

        connection.end(); // Close connection after all queries
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});

//=================Dynamic PIE Chart Expense==================================
// Get available months for filter
app.get('/dynamic_pie_expense',isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [months] = await connection.query(`
            SELECT DISTINCT DATE_FORMAT(VoucherDate, '%Y-%m') AS month 
            FROM all_dbl_entry 
            ORDER BY VoucherDate DESC
        `);        
        res.render('DynamicPieExpense', { months: months.map(m => m.month) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/dynamic_pie_expense/data', isAuthenticated, async (req, res) => {
    const selectedMonth = req.query.month;
    
    try {
        const connection = await connectToDatabase();
        const [results] = await connection.query(`
            SELECT 
                AccountName,
                SUM(DebitAmount) AS DebitAmount,
                SUM(CreditAmount) AS CreditAmount
            FROM all_dbl_entry
            WHERE 
                AccountName NOT IN ('Bank', 'Cash')
                AND DATE_FORMAT(VoucherDate, '%Y-%m') = ?
            GROUP BY AccountName
        `, [selectedMonth]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//==================Dynamic Bar Chart Expense=================================

// Get available months
app.get('/dynamic_bar_expense', isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [months] = await connection.query(`
            SELECT DISTINCT DATE_FORMAT(VoucherDate, '%Y-%m') AS month 
            FROM all_dbl_entry 
            ORDER BY VoucherDate DESC
        `);
        res.render('DynamicBarExpense', { months: months.map(m => m.month) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/dynamic_bar_expense/data', isAuthenticated, async (req, res) => {
    const selectedMonth = req.query.month;
    
    try {
        const connection = await connectToDatabase();
        const [results] = await connection.query(`
            SELECT 
                AccountName,
                SUM(DebitAmount) AS DebitAmount,
                SUM(CreditAmount) AS CreditAmount
            FROM all_dbl_entry
            WHERE 
                AccountName NOT IN ('Bank', 'Cash')
                AND DATE_FORMAT(VoucherDate, '%Y-%m') = ?
            GROUP BY AccountName
            ORDER BY AccountName
        `, [selectedMonth]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//======================Dynamic Bar Chart Trading===========================
// Get available months
app.get('/dynamic_bar_trade', isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [months] = await connection.query(`
            SELECT DISTINCT DATE_FORMAT(BuyDate, '%Y-%m') AS month 
            FROM dynamic_trade 
            ORDER BY BuyDate DESC
        `);
        res.render('DynamicBarTrade', { months: months.map(m => m.month) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/dynamic_bar_trade/data', isAuthenticated, async (req, res) => {
    const selectedMonth = req.query.month;
    
    try {
        const connection = await connectToDatabase();
        const [results] = await connection.query(`
            SELECT 
                ScripName,
                SUM(sum_profit) AS SumProfit,
                SUM(sum_deposit) AS SumDeposit
            FROM dynamic_trade
            WHERE                
                DATE_FORMAT(BuyDate, '%Y-%m') = ?
            GROUP BY ScripName
            ORDER BY ScripName
        `, [selectedMonth]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//======================Dynamic Bar Finance===========================
// Get available months
app.get('/dynamic_bar_finance', isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [months] = await connection.query(`
            SELECT DISTINCT DATE_FORMAT(Date, '%Y-%m') AS month 
            FROM budget_excel 
            ORDER BY Date DESC
        `);
        res.render('DynamicBarFinance', { months: months.map(m => m.month) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/dynamic_bar_finance/data', isAuthenticated, async (req, res) => {
    const selectedMonth = req.query.month;
    
    try {
        const connection = await connectToDatabase();
        const [results] = await connection.query(`
            SELECT 
                Category,
                SUM(Amount) AS SumProfit                
            FROM budget_excel
            WHERE                
                DATE_FORMAT(Date, '%Y-%m') = ?
            GROUP BY Category
            ORDER BY Category
        `, [selectedMonth]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//=====================Dynamic Bar Category Filter===========================
// Get available accounts
app.get('/dynamic_bar_category', async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [accounts] = await connection.query(`
            SELECT DISTINCT AccountName 
            FROM all_dbl_entry 
            WHERE AccountName NOT IN ('Bank', 'Cash', 'Sy Dr', 'Card Fee', 'House Purchase')
            ORDER BY AccountName ASC
        `);
        res.render('DynamicBarCategory', { accounts: accounts.map(a => a.AccountName) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/dynamic_bar_category/data', async (req, res) => {
    const selectedAccount = req.query.account;
    const connection = await connectToDatabase();
    try {
        const [results] = await connection.query(`
            SELECT 
                DATE_FORMAT(VoucherDate, '%Y-%m') AS month,
                SUM(DebitAmount) AS DebitAmount,
                SUM(CreditAmount) AS CreditAmount
            FROM all_dbl_entry
            WHERE 
                AccountName = ?
            GROUP BY DATE_FORMAT(VoucherDate, '%Y-%m')
            ORDER BY VoucherDate ASC
        `, [selectedAccount]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//=====================Dynamic Budget Filter ================================
// Get available types
app.get('/budget', async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [categories] = await connection.query(`
            SELECT DISTINCT Category 
            FROM budget_excel
            WHERE Category IS NOT NULL
            ORDER BY Category ASC
        `);
        res.render('Budget', { categories: categories.map(c => c.Category) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/budget/data', async (req, res) => {
    const { period, category } = req.query;
    let dateFormat, groupBy;
    const connection = await connectToDatabase();

    switch(period) {
        case 'yearly': 
            dateFormat = '%Y';
            groupBy = 'YEAR(Date)';
            break;
        case 'quarterly': 
            dateFormat = '%Y-Q%q';
            groupBy = 'YEAR(Date), QUARTER(Date)';
            break;
        case 'monthly': 
            dateFormat = '%Y-%m';
            groupBy = 'YEAR(Date), MONTH(Date)';
            break;
        case 'weekly': 
            dateFormat = '%x-W%v';
            groupBy = 'YEARWEEK(Date, 3)'; // ISO week
            break;
        default: 
            dateFormat = '%Y';
            groupBy = 'YEAR(Date)';
    }

    try {
        const [results] = await connection.query(`
            SELECT 
                DATE_FORMAT(Date, ?) AS Period,
                Type,
                SUM(Amount) AS TotalAmount
            FROM budget_excel
            WHERE Category = ?
            GROUP BY ${groupBy}, Type
            ORDER BY Date ASC
        `, [dateFormat, category]);

        // For quarterly data, ensure all quarters are present
        if (period === 'quarterly') {
            const yearMap = new Map();
            results.forEach(row => {
                const [year] = row.Period.split('-Q');
                if (!yearMap.has(year)) yearMap.set(year, new Set());
                yearMap.get(year).add(row.Period);
            });

            yearMap.forEach((quarters, year) => {
                for (let q = 1; q <= 4; q++) {
                    const period = `${year}-Q${q}`;
                    if (!quarters.has(period)) {
                        results.push({
                            Period: period,
                            Type: 'Income',
                            TotalAmount: 0
                        });
                        results.push({
                            Period: period,
                            Type: 'Expenses',
                            TotalAmount: 0
                        });
                    }
                }
            });
        }

        res.json(results.sort((a, b) => a.Period.localeCompare(b.Period)));
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//==========================Savings Bar Chart ===============================
app.get('/savings', async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [years] = await connection.query(`
            SELECT DISTINCT YEAR(Date) AS year 
            FROM budget_excel 
            ORDER BY year DESC
        `);
        res.render('Savings', { years: years.map(y => y.year) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.get('/savings/data', async (req, res) => {
    const year = req.query.year;
    const connection = await connectToDatabase();
    try {
        const [results] = await connection.query(`
            SELECT 
                MONTH(Date) AS month,
                Type,
                SUM(Amount) AS TotalAmount
            FROM budget_excel
            WHERE YEAR(Date) = ?
            GROUP BY MONTH(Date), Type
            ORDER BY MONTH(Date) ASC
        `, [year]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});


//========================Dynamic Bar ScripName Filter========================
// Get available ScripName
app.get('/dynamic_bar_scripName', async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const [accounts] = await connection.query(`
            SELECT DISTINCT ScripName 
            FROM dynamic_trade
            WHERE ScripName IN ('NIFTY', 'BANKNIFTY')            
            ORDER BY ScripName ASC
        `);
        res.render('DynamicBarScripName', { accounts: accounts.map(a => a.ScripName) });
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get filtered data
app.get('/dynamic_bar_scripName/data', async (req, res) => {
    const selectedAccount = req.query.account;
    const connection = await connectToDatabase();
    try {
        const [results] = await connection.query(`
            SELECT 
                DATE_FORMAT(BuyDate, '%Y-%m') AS month,
                SUM(sum_profit) AS DebitAmount,
                SUM(sum_deposit) AS CreditAmount
            FROM dynamic_trade
            WHERE 
                ScripName = ?
            GROUP BY DATE_FORMAT(BuyDate, '%Y-%m')
            ORDER BY BuyDate ASC
        `, [selectedAccount]);

        res.json(results);
        connection.close();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
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
// Route to fetch and display all calendar entries
app.get("/calendar", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const query = "SELECT ApptID, ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority FROM tblAppointments ORDER BY ApptStart DESC";

        const [database] = await connection.execute(query);

        // Format ApptStart and ApptEnd for display
        database.forEach(row => {
            if (row.ApptStart) row.ApptStart = formatDate(row.ApptStart);
            if (row.ApptEnd) row.ApptEnd = formatDate(row.ApptEnd);
        });

        res.render("calendar", { database });

        connection.end();
    } catch (err) {
        console.error("Error fetching calendar data:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to render Insert/Edit form
app.get("/calendar/:action/:id?", isAuthenticated, async (req, res) => {
    try {
        const { action, id } = req.params;

        if (action === "edit" && id) {
            const connection = await connectToDatabase();
            const query = "SELECT * FROM tblAppointments WHERE ApptID = ?";
            const [database] = await connection.execute(query, [id]);

            connection.end();

            if (database.length > 0) {
                const data = database[0];

                // Format date-time fields for `datetime-local` input
                if (data.ApptStart) data.ApptStart = formatDate(data.ApptStart);
                if (data.ApptEnd) data.ApptEnd = formatDate(data.ApptEnd);

                res.render("calendar_form", { action, data });
            } else {
                res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            res.render("calendar_form", { action, data: {} });
        } else {
            res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error fetching data for edit:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle Insert/Update logic
app.post("/calendar/:action/:id?", async (req, res) => {
    try {
        const { action, id } = req.params;
        const { ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority } = req.body;
        const connection = await connectToDatabase();

        if (action === "insert") {
            // Insert new record
            const query = `INSERT INTO tblAppointments (ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority) VALUES (?, ?, ?, ?, ?, ?)`;
            await connection.execute(query, [ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority]);
        } else if (action === "edit" && id) {
            // Update existing record
            const query = `UPDATE tblAppointments SET ApptSubject = ?, ApptLocation = ?, ApptStart = ?, ApptEnd = ?, ApptNotes = ?, Priority = ? WHERE ApptID = ?`;
            await connection.execute(query, [ApptSubject, ApptLocation, ApptStart, ApptEnd, ApptNotes, Priority, id]);
        } else {
            connection.end();
            return res.status(400).send("Invalid action.");
        }

        connection.end();
        res.redirect("/calendar");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});

//===============================Documents=========================================
// Render document table with Insert and Edit actions
const fs = require("fs");
// Route to fetch and display all documents
app.get("/document", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const query = `
            SELECT DocID, DocUserName, DocName, DocPath, DocText 
            FROM DocT 
            JOIN DocUserT ON DocT.DocUserID = DocUserT.DocUserID 
            ORDER BY DocID DESC
        `;

        const [database] = await connection.execute(query);
        connection.end();

        res.render("document", { database });
    } catch (err) {
        console.error("Error fetching documents:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle "Open" action
app.get("/document/open/:id", isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await connectToDatabase();
        const query = "SELECT DocPath FROM DocT WHERE DocID = ?";
        const [results] = await connection.execute(query, [id]);
        connection.end();

        if (results.length > 0) {
            const filePath = results[0].DocPath;
            const fullPath = path.resolve(filePath);

            // Verify file exists
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
    } catch (err) {
        console.error("Error fetching document path:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to render Insert/Edit form with combo box
app.get("/document/:action/:id?", isAuthenticated, async (req, res) => {
    try {
        const { action, id } = req.params;
        const connection = await connectToDatabase();

        // Fetch users for dropdown
        const comboQuery = "SELECT DocUserID, DocUserName FROM DocUserT";
        const [users] = await connection.execute(comboQuery);

        if (action === "edit" && id) {
            // Fetch document details for editing
            const editQuery = "SELECT DocID, DocUserID, DocName, DocPath, DocText FROM DocT WHERE DocID = ?";
            const [database] = await connection.execute(editQuery, [id]);
            connection.end();

            if (database.length > 0) {
                const data = database[0];
                res.render("document_form", { action, data, users });
            } else {
                res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            connection.end();
            const defaultData = { DocUserID: users[0]?.DocUserID || 1 };
            res.render("document_form", { action, data: defaultData, users });
        } else {
            connection.end();
            res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error fetching data for form:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to handle Insert/Update logic
app.post("/document/:action/:id?", isAuthenticated, async (req, res) => {
    try {
        const { action, id } = req.params;
        const { DocUserID, DocName, DocPath, DocText } = req.body;
        const connection = await connectToDatabase();

        if (action === "insert") {
            const query = "INSERT INTO DocT (DocUserID, DocName, DocPath, DocText) VALUES (?, ?, ?, ?)";
            await connection.execute(query, [DocUserID, DocName, DocPath, DocText]);
        } else if (action === "edit" && id) {
            const query = "UPDATE DocT SET DocName = ?, DocPath = ?, DocText = ?, DocUserID = ? WHERE DocID = ?";
            await connection.execute(query, [DocName, DocPath, DocText, DocUserID, id]);
        } else {
            connection.end();
            return res.status(400).send("Invalid action.");
        }

        connection.end();
        res.redirect("/document");
    } catch (err) {
        console.error("Error processing document:", err);
        res.status(500).send("Internal Server Error");
    }
});


//===============================Trades=========================================
// Render trade table with Insert and Edit actions
app.get("/trade", isAuthenticated, async (req, res) => {
    
    const connection = await connectToDatabase();
    const query = `
        SELECT tradelinet.TradeLineID, tradelinet.TradeID, tradet.BuyDate, tradetypet.TradeType, tradelinet.BuyQty, tradelinet.BuyPrice, tradelinet.SellPrice, tradelinet.Brokerage, tradelinet.DepositWithdrawal,(SellPrice * BuyQty) - (BuyPrice * BuyQty) - Brokerage AS GrossProfit,SellPrice - BuyPrice AS Pips, tradelinet.SellDate, tradelinet.Note FROM tradelinet INNER JOIN tradet ON tradelinet.TradeID = tradet.TradeID JOIN brokert ON tradelinet.BrokerID = brokert.BrokerID JOIN tradetypet ON tradelinet.TradeTypeID = tradetypet.TradeTypeID JOIN scripnamet ON tradelinet.ScripID = scripnamet.ScripID 
        ORDER BY tradelinet.TradeID DESC`;
    
    try {
        const [database] = await connection.execute(query); // Ensure 'mysql2/promise' is used
        database.forEach(row => {
            if (row.BuyDate) row.BuyDate = formatDate(row.BuyDate);
            if (row.SellDate) row.SellDate = formatDate(row.SellDate);
        });
        res.render("trade", { database });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/trade/:action/:id?", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const { action, id } = req.params;

        const brokerQuery = "SELECT BrokerID, BrokerName FROM brokert";
        const scripQuery = "SELECT ScripID, ScripName FROM scripnamet";
        const typeQuery = "SELECT TradeTypeID, TradeType FROM tradetypet";
        const tradeIDQuery = "SELECT TradeID FROM tradet ORDER BY TradeID DESC LIMIT 1";

        const [brokers] = await connection.execute(brokerQuery);
        const [scrips] = await connection.execute(scripQuery);
        const [types] = await connection.execute(typeQuery);

        if (action === "edit" && id) {
            const editQuery = `
                SELECT TradeLineID, TradeID, BrokerID, ScripID, TradeTypeID, BuyQty, BuyPrice, SellPrice, Brokerage, DepositWithdrawal, SellDate, Note 
                FROM TradeLineT 
                WHERE TradeLineID = ?`;
            
            const [database] = await connection.execute(editQuery, [id]);

            if (database.length > 0) {
                const data = database[0];
                if (data.BuyDate) data.BuyDate = formatDate(data.BuyDate);
                if (data.SellDate) data.SellDate = formatDate(data.SellDate);
                return res.render("trade_form", { action, data, brokers, scrips, types });
            } else {
                return res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            const [result] = await connection.execute(tradeIDQuery);
            const latestTradeID = result.length > 0 ? result[0].TradeID : 0;
            const nextTradeID = latestTradeID;

            // Default values for the form
            const defaultData = {
                TradeID: nextTradeID, // Auto-populated TradeID
                BrokerID: brokers[0]?.BrokerID || 1, // Default BrokerID
                ScripID: scrips[24]?.ScripID || 1,    // Default ScripID
                TradeTypeID: types[0]?.TradeTypeID || 1 // Default TradeTypeID
            };

            return res.render("trade_form", { action, data: defaultData, brokers, scrips, types });
        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (error) {
        console.error("Error processing trade request:", error);
        return res.status(500).send("Internal Server Error");
    }
});


// Route to handle Insert/Update logic
app.post("/trade/:action/:id?", async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const { action, id } = req.params;
        const { BuyQty, BrokerID, ScripID, TradeTypeID, Brokerage, BuyPrice, SellPrice, DepositWithdrawal, Note, SellDate, TradeID } = req.body;

        if (action === "insert") {
            const query = `INSERT INTO tradelinet 
                (BuyQty, BrokerID, ScripID, TradeTypeID, Brokerage, BuyPrice, SellPrice, DepositWithdrawal, Note, SellDate, TradeID) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [BuyQty, BrokerID, ScripID, TradeTypeID, Brokerage, BuyPrice, SellPrice, DepositWithdrawal, Note, SellDate, TradeID];

            await connection.execute(query, values);
            res.redirect("/trade/insert");
        } else if (action === "edit" && id) {
            const updateQuery = `
                UPDATE TradeLineT 
                SET 
                    TradeID = ?, 
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
                WHERE TradeLineID = ?`;

            const values = [
                TradeID, BrokerID, ScripID, TradeTypeID, 
                BuyQty, BuyPrice, SellPrice, Brokerage, 
                DepositWithdrawal, SellDate, Note, id
            ];

            await connection.execute(updateQuery, values);
            res.redirect("/trade");
        } else {
            res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    }
});


//===============================Trade ID Generate=======================================
// Render tradeid table with Insert and Edit actions
app.get("/tradeid", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const query = "SELECT TradeID, BuyDate FROM tradet ORDER BY TradeID DESC";
        const [database] = await connection.execute(query);

        // Format BuyDate for all rows
        database.forEach(row => {
            if (row.BuyDate) row.BuyDate = formatDate(row.BuyDate);
        });

        res.render("tradeid", { database });
    } catch (err) {
        console.error("Error fetching TradeID data:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to render Insert/Edit form with combo box
app.get("/tradeid/:action/:id?", isAuthenticated, async (req, res) => {
    const connection = await connectToDatabase();
    const { action, id } = req.params;

    try {
        if (action === "edit" && id) {
            const editQuery = `SELECT TradeID, BuyDate FROM tradet WHERE TradeID = ?`;
            const [database] = await connection.execute(editQuery, [id]);

            if (database.length > 0) {
                const data = database[0];
                // Format date for display
                if (data.BuyDate) data.BuyDate = formatDate(data.BuyDate);
                return res.render("tradeid_form", { action, data });
            } else {
                return res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            return res.render("tradeid_form", { action, data: {} });
        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error fetching TradeID data:", err);
        return res.status(500).send("Internal Server Error");
    }
});


// Route to handle Insert/Update logic
app.post("/tradeid/:action/:id?", async (req, res) => {
    const connection = await connectToDatabase();
    const { action, id } = req.params;
    const { BuyDate } = req.body;

    try {
        if (action === "insert") {
            const query = "INSERT INTO tradet (BuyDate) VALUES (?)";
            await connection.execute(query, [BuyDate]);

            return res.redirect("/trade/insert");
        } else if (action === "edit" && id) {
            const updateQuery = "UPDATE tradet SET BuyDate = ? WHERE TradeID = ?";
            await connection.execute(updateQuery, [BuyDate, id]);

            return res.redirect("/tradeid");
        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
    }
});


//===============================Finance=========================================
// Render trade table with Insert and Edit actions
app.get("/finance", isAuthenticated, async (req, res) => {
    const connection = await connectToDatabase();
    const query = `
        SELECT 
            VoucherLineT.VoucherLineID, 
            VoucherT.VoucherID, 
            VoucherT.VoucherDate, 
            VoucherTypeT.VoucherType, 
            AccountDetailT.AccountName, 
            AccountTypeT.AccountType, 
            VoucherLineT.DebitAmount, 
            VoucherLineT.CreditAmount, 
            VoucherLineT.Narration, 
            VoucherLineT.Notes, 
            VoucherLineT.IsExported 
        FROM VoucherLineT 
        INNER JOIN VoucherT ON VoucherLineT.fVoucherID = VoucherT.VoucherID 
        JOIN VoucherTypeT ON VoucherT.fVoucherType = VoucherTypeT.VoucherTypeID 
        JOIN AccountDetailT ON VoucherLineT.fAccountDetail = AccountDetailT.AccountDetailID 
        JOIN AccountTypeT ON VoucherLineT.fAccountType = AccountTypeT.AccountTypeID 
        ORDER BY VoucherT.VoucherDate DESC, VoucherT.VoucherID`;

    try {
        const [database] = await connection.execute(query);

        // Format VoucherDate for all rows
        database.forEach(row => {
            if (row.VoucherDate) row.VoucherDate = formatDate(row.VoucherDate);
        });

        res.render("finance", { database });
    } catch (err) {
        console.error("Error fetching finance data:", err);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/finance/:action/:id?", isAuthenticated, async (req, res) => { 
    const connection = await connectToDatabase();   
    const { action, id } = req.params;

    try {
        // Fetch necessary data
        const [accountDetails] = await connection.execute("SELECT AccountDetailID, AccountName FROM accountdetailt");
        const [accountTypes] = await connection.execute("SELECT AccountTypeID, AccountType FROM accounttypet");
        const [modes] = await connection.execute("SELECT ModeID, ChkMode FROM tblchkmode");

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

            const [database] = await connection.execute(editQuery, [id]);

            if (database.length > 0) {
                const data = database[0];
                res.render("finance_form", { action, data, accountDetails, accountTypes, modes });
            } else {
                res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            // Fetch latest VoucherID
            const [voucherResult] = await connection.execute("SELECT VoucherID FROM vouchert ORDER BY VoucherID DESC LIMIT 1");
            const latestVoucherID = voucherResult.length > 0 ? voucherResult[0].VoucherID : 0;

            // Fetch latest Narration & Notes
            const [narrationNotesResult] = await connection.execute(`
                SELECT Narration, Notes 
                FROM VoucherLineT 
                ORDER BY VoucherLineID DESC 
                LIMIT 1
            `);
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
        } else {
            res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error handling finance request:", err);
        res.status(500).send("Internal Server Error");
    }
});



// Route to handle Insert/Update logic
app.post("/finance/:action/:id?", async (req, res) => {
    const connection = await connectToDatabase();
    const { action, id } = req.params;
    const { AccountDetailID, AccountTypeID, DebitAmount, CreditAmount, Narration, Notes, VoucherID } = req.body;

    try {
        if (action === "insert") {
            // Query to count entries for the same VoucherID
            const checkQuery = "SELECT COUNT(*) AS count FROM VoucherLineT WHERE fVoucherID = ?";
            const [results] = await connection.execute(checkQuery, [VoucherID]);

            const entryCount = results[0].count;

            if (entryCount >= 2) {
                // Restrict further entries
                return res.status(400).send("Cannot add more than 2 entries for the same VoucherID.");
            }

            // Proceed with insert logic
            const query = `
                INSERT INTO VoucherLineT 
                (fAccountDetail, fAccountType, DebitAmount, CreditAmount, Narration, Notes, fVoucherID, IsExported) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            `;
            const values = [AccountDetailID, AccountTypeID, DebitAmount, CreditAmount, Narration, Notes, VoucherID];

            await connection.execute(query, values);
            res.redirect("/finance/insert");
        } else if (action === "edit" && id) {
            // Skip the "more than 2 entries" check for edit
            const updateQuery = `
                UPDATE VoucherLineT 
                SET fVoucherID = ?, fAccountDetail = ?, fAccountType = ?, 
                    DebitAmount = ?, CreditAmount = ?, Narration = ?, Notes = ?, IsExported = 0 
                WHERE VoucherLineID = ?
            `;

            const values = [
                VoucherID, AccountDetailID, AccountTypeID,
                DebitAmount, CreditAmount, Narration,
                Notes, id
            ];

            await connection.execute(updateQuery, values);
            res.redirect("/finance");
        } else {
            res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error handling finance request:", err);
        res.status(500).send("Internal Server Error");
    }
});

//===============================Finance ID===============================
// Render financeid table with Insert and Edit actions
app.get("/financeid", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const query = "SELECT VoucherID, VoucherDate, fVoucherType FROM vouchert ORDER BY VoucherID DESC";
        const [database] = await connection.execute(query);

        // Format VoucherDate for all rows
        database.forEach(row => {
            if (row.VoucherDate) row.VoucherDate = formatDate(row.VoucherDate);
        });

        res.render("financeid", { database });
    } catch (err) {
        console.error("Error fetching finance IDs:", err);
        res.status(500).send("Internal Server Error");
    }
});


// Route to render Insert/Edit form with combo box
app.get("/financeid/:action/:id?", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const { action, id } = req.params;

        // Fetch voucher types for the combo box
        const voucherTypeQuery = "SELECT VoucherTypeID, VoucherType FROM VoucherTypeT";
        const [voucherTypes] = await connection.execute(voucherTypeQuery);

        if (action === "edit" && id) {
            const editQuery = `
                SELECT VoucherID, VoucherDate, fVoucherType AS VoucherTypeID 
                FROM vouchert 
                WHERE VoucherID = ?`;
            const [database] = await connection.execute(editQuery, [id]);

            if (database.length > 0) {
                const data = database[0];
                if (data.VoucherDate) data.VoucherDate = formatDate(data.VoucherDate);
                return res.render("financeid_form", { action, data, voucherTypes });
            } else {
                return res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            const defaultData = {};
            return res.render("financeid_form", { action, data: defaultData, voucherTypes });
        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error handling financeid action:", err);
        res.status(500).send("Internal Server Error");
    }
});



// Route to handle Insert/Update logic
app.post("/financeid/:action/:id?", async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const { action, id } = req.params;
        const { VoucherDate, VoucherTypeID } = req.body;

        if (action === "insert") {
            const query = "INSERT INTO vouchert (VoucherDate, fVoucherType) VALUES (?, ?)";
            await connection.execute(query, [VoucherDate, VoucherTypeID]);
            return res.redirect("/finance/insert");
        } else if (action === "edit" && id) {
            const updateQuery = `
                UPDATE vouchert
                SET VoucherDate = ?, fVoucherType = ? 
                WHERE VoucherID = ?`;
            await connection.execute(updateQuery, [VoucherDate, VoucherTypeID, id]);
            return res.redirect("/financeid");
        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error processing financeid action:", err);
        res.status(500).send("Internal Server Error");
    }
});


//===============================Calculator===================================
// Route for the calculator
app.get('/calculator', isAuthenticated, (req, res) => {
    res.render('calculator');
});
//===================================Password==================================
// Render document table with Insert and Edit actions
app.get("/password", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const query = "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain ORDER BY WebsiteID DESC";
        const [database] = await connection.execute(query);
        res.render("password", { database });
    } catch (err) {
        console.error("Error fetching password data:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to render Insert/Edit form
app.get("/password/:action/:id?", isAuthenticated, async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const { action, id } = req.params;

        if (action === "edit" && id) {
            const query = "SELECT WebsiteID, WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2 FROM tblWebsiteMain WHERE WebsiteID = ?";
            const [database] = await connection.execute(query, [id]);

            if (database.length > 0) {
                const data = database[0];
                return res.render("password_form", { action, data });
            } else {
                return res.status(404).send("Record not found.");
            }
        } else if (action === "insert") {
            return res.render("password_form", { action, data: {} });
        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error processing password action:", err);
        res.status(500).send("Internal Server Error");
    }
});


// Route to handle Insert/Update logic
app.post("/password/:action/:id?", async (req, res) => {
    try {
        const connection = await connectToDatabase();
        const { action, id } = req.params;
        const { WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2 } = req.body;

        if (action === "insert") {
            // Insert new record
            const query = `
                INSERT INTO tblWebsiteMain 
                (WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const values = [WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2];

            await connection.execute(query, values);
            return res.redirect("/password");

        } else if (action === "edit" && id) {
            // Update existing record
            const query = `
                UPDATE tblWebsiteMain 
                SET WebsiteName = ?, UserName = ?, Password = ?, LinkedEmail = ?, LinkedMobile = ?, Note1 = ?, Note2 = ? 
                WHERE WebsiteID = ?`;
            const values = [WebsiteName, UserName, Password, LinkedEmail, LinkedMobile, Note1, Note2, id];

            await connection.execute(query, values);
            return res.redirect("/password");

        } else {
            return res.status(400).send("Invalid action.");
        }
    } catch (err) {
        console.error("Error processing password action:", err);
        return res.status(500).send("Internal Server Error");
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
