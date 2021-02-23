const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const Cipher = require('aes-ecb')
const Validator = require('jsonschema').Validator

var app = express();

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

// GET method route
app.get('/encrypt-test-data', function (req, res) {
  var request = {};
  request.cardNo = '1234567890123456';
  request.expYear = '25';
  request.expMonth = '12';
  request.idNo = '800212';
  request.cardPw = '12';
  request.merchantKey = 'TPP4afX4e5US6FEl0MnoyRHT/yzTRZVrKGJVBmew66y8jSDOt5ZNigM0DM/WZdYbev7OV/lTUEewzhq5dqKygg==';

  encryptData(request, res);
});

// POST method route
app.post('/encrypt', function(req, res) {
  encryptData(req, res);
});

function encryptData(req, res) {

  var response = {};

  console.log('VALIDATE', 'MESSAGE', JSON.stringify(req, null, 2));

  // Validate data using a schema.
  const v = new Validator();
  const validationResult = v.validate(req, requestSchema);

  response.isValid = (validationResult.errors.length === 0);
  if (response.isValid !== true) {
    response.errors = validationResult.errors;
    res.status(500).jsonp(response);
    return;
  }

  var cardNo = '1234567890123456';
  var expYear = '25';
  var expMonth = '12';
  var idNo = '800212';
  var cardPw = '12';
  var merchantKey = 'TPP4afX4e5US6FEl0MnoyRHT/yzTRZVrKGJVBmew66y8jSDOt5ZNigM0DM/WZdYbev7OV/lTUEewzhq5dqKygg==';

  var keyString = merchantKey.substr(0, 16);

  var plainText = `CardNo=${cardNo}&ExpYear=${expYear}&ExpMonth=${expMonth}&IDNo=${idNo}&CardPw=${cardPw}`;

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