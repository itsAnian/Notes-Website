const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const noteRoutes = require('./routes/note');

app.use('/', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/', noteRoutes);

app.get('/', (req, res) => {
    res.redirect('/login');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
