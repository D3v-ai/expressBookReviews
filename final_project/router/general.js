const express = require('express');
const bcrypt = require('bcryptjs'); // Needed for password hashing during registration

// Import the 'books' object directly from booksdb.js (using its exact export)
let books = require("./booksdb.js");

// Import the centralized 'users' array from auth_users.js
// This ensures registration adds users to the same list used for login/validation
let users = require("./auth_users.js").users;

const public_users = express.Router();

// --- Helper function for checking if username already exists ---
// This function checks the centralized 'users' array.
const doesExist = (username)=>{
    let userswithsamename = users.filter((user)=>{
      return user.username === username
    });
    if(userswithsamename.length > 0){
      return true;
    } else {
      return false;
    }
}

// --- Route for User Registration ---
// Route: POST /register
// Allows new users to sign up. Passwords are hashed for security.
public_users.post("/register", async (req,res) => { // 'async' is crucial for 'await bcrypt.hash'
    const username = req.body.username;
    const password = req.body.password;

    // Validate request input: username and password must be provided
    if (!username || !password) {
        return res.status(400).json({message: "Unable to register user. Username and password are required."});
    }

    // Check if username already exists to prevent duplicates
    if (doesExist(username)) {
        return res.status(409).json({message: "User already exists!"}); // 409 Conflict: indicates conflict with current state of resource
    }

    try {
        // Hash the password for secure storage. Salt rounds = 10 is a good default.
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Add the new user with their hashed password to the centralized 'users' array
        users.push({"username": username, "password": hashedPassword});

        return res.status(200).json({message: "User successfully registered. You can now login."});
    } catch (error) {
        // Catch any errors during password hashing or user creation
        return res.status(500).json({message: "Error during user registration.", error: error.message});
    }
});

// --- Get the book list available in the shop ---
// Route: GET /
// Returns all books from the 'booksdb.js' data store.
public_users.get('/',function (req, res) {
    res.status(200).json(books); // 'books' now directly refers to the imported object
});

// --- Get book details based on ISBN (which are numerical IDs in booksdb.js) ---
// Route: GET /isbn/:isbn
public_users.get('/isbn/:isbn',function (req, res) {
    const isbn = req.params.isbn; // Retrieve the ISBN (numerical ID) from URL parameters
    const book = books[isbn]; // Access the book directly from the 'books' object

    if (book) {
        res.status(200).json(book); // Send book details if found
    } else {
        res.status(404).json({message: "Book not found with this ISBN."}); // Send 404 if not found
    }
});
 
// --- Get book details based on author (case-insensitive partial match) ---
// Route: GET /author/:author
public_users.get('/author/:author',function (req, res) {
    const author = req.params.author; // Retrieve author name from URL parameters
    let filtered_books = [];

    // Iterate through all books to find matches by author
    for (let id in books) {
        if (books.hasOwnProperty(id)) { // Ensure it's an own property, not inherited
            let book = books[id];
            // Check for case-insensitive partial match in author name
            if (book.author.toLowerCase().includes(author.toLowerCase())) {
                filtered_books.push(book); // Add matching book to the list
            }
        }
    }

    if (filtered_books.length > 0) {
        res.status(200).json(filtered_books); // Send filtered books if any are found
    } else {
        res.status(404).json({message: "No books found by this author."}); // Send 404 if no books found
    }
});

// --- Get all books based on title (case-insensitive partial match) ---
// Route: GET /title/:title
public_users.get('/title/:title',function (req, res) {
    const title = req.params.title; // Retrieve title from URL parameters
    let filtered_books = [];

    for (let id in books) {
        if (books.hasOwnProperty(id)) {
            let book = books[id];
            // Check for case-insensitive partial match in title
            if (book.title.toLowerCase().includes(title.toLowerCase())) {
                filtered_books.push(book);
            }
        }
    }

    if (filtered_books.length > 0) {
        res.status(200).json(filtered_books);
    } else {
        res.status(404).json({message: "No books found with this title."});
    }
});

// --- Get book reviews for a specific ISBN (numerical ID) ---
// Route: GET /review/:isbn
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn; // Retrieve ISBN (numerical ID) from URL parameters
    const book = books[isbn]; 

    if (book) {
        // Return only the reviews object for the specified book
        res.status(200).json(book.reviews); 
    } else {
        res.status(404).json({message: "Book not found with this ISBN."});
    }
});

module.exports.general = public_users; // Export this router for use in index.js