// const express = require('express');
// const mongoose = require('mongoose');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const bodyParser = require('body-parser');
// const path = require('path');

// const app = express();

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/student_management', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// // Middleware
// app.set('view engine', 'ejs');
// app.use(express.static('public'));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // Session configuration
// app.use(session({
//   secret: 'your-secret-key',
//   resave: false,
//   saveUninitialized: false,
//   store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/student_management' })
// }));

// // Models
// const User = require('./models/User');
// const Student = require('./models/Student');
// const Educator = require('./models/Educator');
// const Program = require('./models/Program');
// const Assessment = require('./models/Assessment');

// // Routes
// app.use('/', require('./routes/auth'));
// app.use('/admin', require('./routes/admin'));
// app.use('/educator', require('./routes/educator'));
// app.use('/student', require('./routes/student'));

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Connect to MongoDB (Use Cloud URL from environment variables)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration with MongoDB Atlas
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key", // Use environment variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // Use Atlas for session storage
  })
);

// Models
const User = require("./models/User");
const Student = require("./models/Student");
const Educator = require("./models/Educator");
const Program = require("./models/Program");
const Assessment = require("./models/Assessment");

app.set("views", path.join(__dirname, "views")); 
app.set("view engine", "ejs");

// Routes
app.use("/", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/educator", require("./routes/educator"));
app.use("/student", require("./routes/student"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
