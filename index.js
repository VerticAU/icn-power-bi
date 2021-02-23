const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

var app = express();

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

// GET method route
app.get('/test', function (req, res) {
  res.send('GET request to the homepage');
});

// POST method route
app.post('/test', function (req, res) {
  res.send('POST request to the homepage');
});