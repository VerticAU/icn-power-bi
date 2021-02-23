const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

var Cipher = require('aes-ecb');

var app = express();

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

// GET method route
app.get('/get-encrypted-data', function (req, res) {
  var cardNo = '1234567890123456';
  var expYear = '25';
  var expMonth = '12';
  var idNo = '800212';
  var cardPw = '12';
  var merchantKey = 'TPP4afX4e5US6FEl0MnoyRHT/yzTRZVrKGJVBmew66y8jSDOt5ZNigM0DM/WZdYbev7OV/lTUEewzhq5dqKygg==';

  var keyString = merchantKey.substr(0, 16);

  var plainText = `CardNo=${cardNo}&ExpYear=${expYear}&ExpMonth=${expMonth}&IDNo=${idNo}&CardPw=${cardPw}`;

  var encrypt = Cipher.encrypt(keyString, plainText);

  res.send(encrypt);
});

// POST method route
app.post('/test', function (req, res) {
  res.send('POST request to the homepage');
});