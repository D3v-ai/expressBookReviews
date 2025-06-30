// axios_client_tasks.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000'; // Your Express server's base URL

// --- Task 10: Get all books using Async/Await ---
async function getAllBooksAsync() {
    console.log("\n--- Task 10: Getting All Books (Async/Await) ---");
    try {
        const response = await axios.get(`${API_BASE_URL}/`); // Calls the GET / route
        console.log("All Books Data:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error getting all books:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
    }
}

// --- Main execution block to run the functions ---
async function runAllTasks() {
    await getAllBooksAsync();

// --- Task 11: Get book details by ISBN using Promises ---
function getBookByISBNPromise(isbn) {
    console.log(`\n--- Task 11: Getting Book by ISBN ${isbn} (Promises) ---`);
    return axios.get(`${API_BASE_URL}/isbn/${isbn}`)
        .then(response => {
            console.log(`Book ${isbn} Data:`, response.data);
            return response.data;
        })
        .catch(error => {
            console.error(`Error getting book by ISBN ${isbn}:`, error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
            throw error; // Re-throw to propagate the error
        });
}

// --- Update Main execution block ---
async function runAllTasks() {
    await getAllBooksAsync();
    await getBookByISBNPromise(8);

    // --- Task 12: Get books by Author using Async/Await ---
async function getBooksByAuthorAsync(author) {
    console.log(`\n--- Task 12: Getting Books by Author "${author}" (Async/Await) ---`);
    try {
        const response = await axios.get(`${API_BASE_URL}/author/${encodeURIComponent(author)}`);
        console.log(`Books by ${author} Data:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error getting books by author "${author}":`, error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
    }
}

// --- Update Main execution block ---
async function runAllTasks() {
    await getAllBooksAsync();
    await getBookByISBNPromise(8);
    await getBooksByAuthorAsync("Jane Austen");

    // --- Task 13: Get books by Title using Promises ---
function getBooksByTitlePromise(title) {
    console.log(`\n--- Task 13: Getting Books by Title "${title}" (Promises) ---`);
    return axios.get(`${API_BASE_URL}/title/${encodeURIComponent(title)}`)
        .then(response => {
            console.log(`Books with title "${title}" Data:`, response.data);
            return response.data;
        })
        .catch(error => {
            console.error(`Error getting books by title "${title}":`, error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
            throw error;
        });
}

// --- Final Update Main execution block ---
async function runAllTasks() {
    await getAllBooksAsync();
    await getBookByISBNPromise(8);
    await getBooksByAuthorAsync("Jane Austen");
    await getBooksByTitlePromise("Pride and Prejudice"); // Test with a valid title

    console.log("\n--- All Async/Promise Tasks Completed ---");
}

runAllTasks()