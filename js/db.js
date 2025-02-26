import sqlite3 from 'sqlite3';

// Create a new database or open an existing one
const db = new sqlite3.Database('calculations.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the calculations database.');
    }
});

// Create a table for storing calculations
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicleType TEXT,
        wke REAL,
        st REAL,
        lt REAL,
        ct REAL,
        n INTEGER,
        s REAL,
        v REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating table ' + err.message);
        }
    });
});

// Function to insert a new calculation
export const insertCalculation = (data) => {
    const { vehicleType, wke, st, lt, ct, n, s, v } = data;
    db.run(`INSERT INTO calculations (vehicleType, wke, st, lt, ct, n, s, v) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [vehicleType, wke, st, lt, ct, n, s, v], 
    function(err) {
        if (err) {
            console.error('Error inserting calculation ' + err.message);
        } else {
            console.log(`A calculation has been inserted with id ${this.lastID}`);
        }
    });
};

// Function to get all calculations
export const getCalculations = (callback) => {
    db.all(`SELECT * FROM calculations`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching calculations ' + err.message);
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
};

// Function to update a calculation
export const updateCalculation = (id, data) => {
    const { vehicleType, wke, st, lt, ct, n, s, v } = data;
    db.run(`UPDATE calculations SET vehicleType = ?, wke = ?, st = ?, lt = ?, ct = ?, n = ?, s = ?, v = ? WHERE id = ?`, 
    [vehicleType, wke, st, lt, ct, n, s, v, id], 
    function(err) {
        if (err) {
            console.error('Error updating calculation ' + err.message);
        } else {
            console.log(`Calculation with id ${id} has been updated.`);
        }
    });
};

// Function to delete a calculation
export const deleteCalculation = (id) => {
    db.run(`DELETE FROM calculations WHERE id = ?`, id, function(err) {
        if (err) {
            console.error('Error deleting calculation ' + err.message);
        } else {
            console.log(`Calculation with id ${id} has been deleted.`);
        }
    });
};

// Close the database connection when done
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database ' + err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
});
