const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const Cipher = require('aes-ecb')
const Validator = require('jsonschema').Validator
const Crypto = require('crypto')
const dateFormat = require('dateformat')
const fs = require('fs');
const request = require('request');
const FormData = require('form-data');  
const fetch   = require('node-fetch');
var http = require('http');


var app = express();

app
  .use(express.json()) // for parsing application/json
  .use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

// GET Encrypt Test Data method route
app.get('/encrypt-test-data', function (req, res) {

  var data = {};
  data.cardNo = '1234567890123456';
  data.expYear = '25';
  data.expMonth = '12';
  data.idNo = '800212';
  data.cardPw = '12';
  data.merchantKey = 'TPP4afX4e5US6FEl0MnoyRHT/yzTRZVrKGJVBmew66y8jSDOt5ZNigM0DM/WZdYbev7OV/lTUEewzhq5dqKygg==';
  data.ediDate = dateFormat(new Date(), 'UTC:yyyymmddhhMMss');

  req.body = {
    encryptedData: encryptString(JSON.stringify(data))
  };
  res.body = data;
  encryptData(req, res);
});

// POST Encrypt Data method route
app.post('/encrypt', function(req, res) {
  encryptData(req, res);
});

// POST Sign Data method route
app.post('/sign', function(req, res) {
  var data = req.body;

  var response = res.body || {};

  // Validate data using a schema.
  const v = new Validator();
  const validationResult = v.validate(data, signSchema);

  response.isValid = (validationResult.errors.length === 0);
  if (response.isValid !== true) {
    response.errors = validationResult.errors;
    res.status(500).json(response);
    return;
  }

  if (!data.ediDate) {
    data.ediDate = dateFormat(new Date(), 'UTC:yyyymmddhhMMss');
  }

  var plainText = `${data.MID}${data.ediDate}${data.moid}${data.merchantKey}`;

  var hex = Crypto
    .createHash("sha256")
    .update(plainText)
    .digest("hex");

    response.signedData = hex;
    response.ediDate = data.ediDate;

    res.json(response);
});

// POST Proof of Consent Registration method route
app.post('/consent', async function(req, res) {
  // try {  

    var data = req.body;

    // var response = res.body || {};

    // Validate data using a schema.
    const v = new Validator();
    const validationResult = v.validate(data, consentSchema);

    let isValid = (validationResult.errors.length === 0);
    if (isValid !== true) {
      // response.errors = validationResult.errors;
      res.status(500).json({resultMsg: validationResult.errors[0].message});
      // res.status(500).json(req.body);
      return;
    }

      // if (!data.ediDate) {
      //   data.ediDate = dateFormat(new Date(), 'UTC:yyyymmddhhMMss');
      // }

      // var plainText = `${data.MID}${data.ediDate}${data.moid}${data.merchantKey}`;

      // var hex = Crypto
      //   .createHash("sha256")
      //   .update(plainText)
      //   .digest("hex");

      //   response.signedData = hex;
      //   response.ediDate = data.ediDate;

      // fetch('https://cxo.eex.cx/35a08fd97ec41ec26a5212072f5e4ec6/tVCUAXOBF7w/uiwcucwcacwear').then(data => {
        // var form = new FormData();
        // form.append("fileext", "mp3");
        // form.append("agreetype", "4");
        // form.append("filename", 'test', {
        //   header: {
        //     'Content-Type': 'audio/mpeg'
        //   }
        // });
        // res.json(form.getBuffer().toString('utf8'));
    
        // form.getLength(function(err, length){
          // if (err) {
            // res.json(err);
          // }

      // var form = new FormData();
      // form.append("fileext", data.fileext);
      // form.append("agreetype", data.agreetype);
      // // form.append("filename", data.base64data, data.filename);
      // form.append("filename", data.base64data, {
      //   filename: data.filename,
      //   header: { 
      //     'Content-Type': data.contentType || 'audio/mpeg'
      //   }
      // });

      request.post({
        url: data.endpoint,
        headers: {
          'Connection': 'keep-alive',
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
          'Api-Key': req.get('Api-Key'),
          'Service-Type': req.get('Service-Type'),
        },
        formData: {
          fileext: data.fileext,
          agreetype: data.agreetype,
          filename: {
            value: data.base64data,
            options: {
              filename: data.filename,
              contentType: data.contentType || 'audio/mpeg'
            }
          }
        }
      }, function(err, response, body) {
        res.status(response.statusCode).json(body);
      });
    
          // var r = request.post(data.endpoint, function(err, response, body) {
          //   res.status(response.statusCode).json(body);
          // });
          // const form = r.form();
          // form.append("fileext", data.fileext);
          // form.append("agreetype", data.agreetype);
          // form.append("filename", data.base64data, {
          //   filename: data.filename,
          //   header: { 
          //     'Content-Type': data.contentType || 'audio/mpeg'
          //   }
          // });
    
          // // r._form = form;
          // r.setHeader('Connection', 'keep-alive');
          // r.setHeader('Accept', '*/*');
          // // r.setHeader('Content-Length', length);
          // r.setHeader('Cache-Control', 'no-cache');
          // r.setHeader('Api-Key', req.get('Api-Key'));
          // r.setHeader('Service-Type', req.get('Service-Type'));
        // });
      // })
      // .catch(err => {
      //     res.send(err);
      // });
  // } catch (e) {
  //   res.status(500).json({resultMsg: e.toString()});
  //   // res.status(500).json({resultMsg: e.message || e.toString()});
  // }
});

function encryptData(req, res) {

  var data = req.body;

  if (data.encryptedData) {
    try {
      data = JSON.parse(decryptString(data.encryptedData));
    } catch(ex) {
      console.log('DECRYPT', 'ERROR', JSON.stringify(ex, null, 2));
    }
  }

  var response = res.body || {};

  // Validate data using a schema.
  const v = new Validator();
  const validationResult = v.validate(data, encryptSchema);

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

function encryptString(clearText) {
  var KEY = Buffer.from(process.env.CRYPTO_KEY, 'base64')

  var encryptedText = null;

  var textBuffer = Buffer.from(clearText, 'utf-8');
  var iv = Crypto.randomBytes(16);

  var cipher = Crypto.createCipheriv('aes-256-cbc', KEY, iv);
  var encryptedBuffer = cipher.update(textBuffer);
  encryptedText = Buffer.concat([iv, encryptedBuffer, cipher.final()]).toString('base64');

  return encryptedText;   
}

function decryptString(encryptedText) {
  var KEY = Buffer.from(process.env.CRYPTO_KEY, 'base64')

  var clearText = null;

  var encryptedBlob = Buffer.from(encryptedText, 'base64');
  var iv = encryptedBlob.slice(0, 16);
  var textBuffer = encryptedBlob.toString('base64', 16);

  var decipher = Crypto.createDecipheriv('aes-256-cbc', KEY, iv);
  clearText = decipher.update(textBuffer,'base64','utf-8');
  clearText += decipher.final('utf-8'); 
   
  return clearText;
}

var signSchema = {
  "id": "/Request",
  "type": "object",
  "properties": {
      "MID": {"type": "string"},
      "ediDate": {"type": "string"},
      "moid": {"type": "string"},
      "merchantKey": {"type": "string"}
  },
  "required": [
      "MID", "moid", "merchantKey"
  ]
};

var encryptSchema = {
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

var consentSchema = {
  "id": "/Request",
  "type": "object",
  "properties": {
      "agreetype": {"type": "string"},
      "fileext": {"type": "string"},
      "filename": {"type": "string"},
      "endpoint": {"type": "string"},
      "base64data": {"type": "string"}
  },
  "required": [
      "agreetype", "fileext", "filename", "endpoint", "base64data"
  ]
};