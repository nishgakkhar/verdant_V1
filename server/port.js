var express = require("express")
var app = express()
// Server port
var HTTP_PORT = 3000 

// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});

module.exports = app;
