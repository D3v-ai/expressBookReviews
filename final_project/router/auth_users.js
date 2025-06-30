const express = require('express');
const jwt = require('jsonwebtoken'); // For signing and verifying JWTs
const bcrypt = require('bcryptjs'); // For password comparison
const books = require('./booksdb.js'); // Imports the 'books' object directly from booksdb.js

// --- Centralized User Data Store ---
// This is the authoritative list of users for the application.
// If you had a 'users' array in server.js or general.js, remove it from there
// to ensure this is the single source of truth.
let users = []; // Stores user objects: { username, password } (password will be hashed)

// --- Helper function to check if a username exists ---
// Used for validation during login and preventing duplicate registrations.
const isValid = (username)=>{
    return users.some(user => user.username === username);
}

// --- Authenticated Router Instance ---
const regd_users = express.Router();

// --- JWT Secret Key (MUST be the same as in index.js) ---
const JWT_SECRET = 'your_super_secret_key_for_jwt_auth_replace_me_with_a_long_random_string'; // <<-- MAKE SURE THIS IS STRONG AND CONSISTENT


// Task 7: Login as a Registered User
// Route: POST /customer/login
// Authenticates a user and issues a JWT upon successful login.
regd_users.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Validate request input
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required for login." });
    }

    // Find the user by username in the centralized users array
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ message: "Invalid username or password." }); // Unauthorized
    }

    try {
        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password); // 'user.password' here is the hashed password
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid username or password." }); // Unauthorized
        }

        // If credentials are valid, generate a JSON Web Token (JWT)
        // The payload typically includes user identification (e.g., username, id)
        // 'expiresIn' sets the token's validity duration.
        const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Store the access token and username in the session.
        // This makes the user authenticated for subsequent requests protected by the middleware in index.js.
        req.session.authorization = {
            accessToken: accessToken,
            username: user.username
        };

        return res.status(200).json({ message: "Login successful.", accessToken: accessToken });
    } catch (error) {
        return res.status(500).json({ message: 'Error during login.', error: error.message });
    }
});

// Task 8: Add/Modify a book review
// Route: PUT /customer/auth/review/:isbn
// This route is protected by the authentication middleware in index.js.
// It allows an authenticated user to add a new review or update their existing one for a book.
regd_users.put("/auth/review/:isbn", (req, res) => { // <<-- Route path updated to include '/auth/'
    const isbn = req.params.isbn;
    // Assuming review text comes from query parameters as per many labs (or use req.body.review for body)
    const reviewText = req.query.review;
    // Get the username of the authenticated user from the session
    const username = req.session.authorization.username;

    if (!reviewText) {
        return res.status(400).json({ message: "Review text is required to add or modify a review." });
    }

    const book = books[isbn]; // Access the book using its numerical ID
    if (!book) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Initialize reviews object if it doesn't exist for the book
    if (!book.reviews) {
        book.reviews = {};
    }

    // Add or modify the review. Reviews are typically keyed by username.
    book.reviews[username] = { text: reviewText, timestamp: new Date().toISOString() }; // Add timestamp for completeness

    return res.status(200).json({ message: `Review for ISBN ${isbn} by ${username} successfully added/modified.`, review: book.reviews[username] });
});


// Task 9: Delete book review added by that particular user
// Route: DELETE /customer/auth/review/:isbn
// This route is protected by the authentication middleware in index.js.
// It allows an authenticated user to delete ONLY their own review for a specific book.
regd_users.delete("/auth/review/:isbn", (req, res) => { // <<-- Route path updated to include '/auth/'
    const isbn = req.params.isbn;
    const username = req.session.authorization.username; // Get username from session

    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Check if the book has reviews and if the authenticated user has a review for this book
    if (book.reviews && book.reviews[username]) {
        delete book.reviews[username]; // Delete the user's specific review
        return res.status(200).json({ message: `Review for ISBN ${isbn} by ${username} successfully deleted.` });
    } else {
        return res.status(404).json({ message: "No review found from this user for this book." });
    }
});


// --- Exports for index.js ---
// Export the isValid helper function (though it's mainly used internally here)
module.exports.isValid = isValid;
// Export the centralized users array so other modules (like general.js for registration) can access it
module.exports.users = users;
// Export the router containing all the authenticated routes
module.exports.authenticated = regd_users;