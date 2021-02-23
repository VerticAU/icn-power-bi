const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const Cipher = require('aes-ecb')
const Validator = require('jsonschema').Validator

var app = express();

app
  .use(express.json()) // for parsing application/json
  .use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

// GET method route
app.get('/encrypt-test-data', function (req, res) {
  var data = {};
  data.cardNo = '1234567890123456';
  data.expYear = '25';
  data.expMonth = '12';
  data.idNo = '800212';
  data.cardPw = '12';
  data.merchantKey = 'TPP4afX4e5US6FEl0MnoyRHT/yzTRZVrKGJVBmew66y8jSDOt5ZNigM0DM/WZdYbev7OV/lTUEewzhq5dqKygg==';

  req.body = data;
  res.body = data;
  encryptData(req, res);
});

// POST method route
app.post('/encrypt', function(req, res) {
  encryptData(req, res);
});

function encryptData(req, res) {

  var data = req.body;

  var response = {};

  console.log('VALIDATE', 'MESSAGE', JSON.stringify(data, null, 2));

  // Validate data using a schema.
  const v = new Validator();
  const validationResult = v.validate(data, requestSchema);

  response.isValid = (validationResult.errors.length === 0);
  if (response.isValid !== true) {
    response.errors = validationResult.errors;
    res.status(500).json(response);
    return;
  }

  var keyString = data.merchantKey.substr(0, 16);

  var plainText = `CardNo=${data.cardNo}&ExpYear=${data.expYear}&ExpMonth=${data.expMonth}&IDNo=${data.idNo}&CardPw=${data.cardPw}`;

  var encrypted = Cipher.encrypt(keyString, encodeURI(plainText));

  var hex = Buffer.from(encrypted, 'base64').toString('hex');
  
  response.encryptedData = hex;

  res.json(response);
}

var requestSchema = {
  "id": "/Request",
  "type": "object",
  "properties": {
      "cardNo": {"type": "string"},
      "expYear": {"type": "string"},
      "expMonth": {"type": "string"},
      "idNo": {"type": "string"},
      "cardPw": {"type": "string"},
      "merchantKey": {"type": "string"}
  },
  "required": [
      "cardNo", "expYear", "expMonth", 
      "idNo", "cardPw", "merchantKey"
  ]
};