const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000
const Validator = require('jsonschema').Validator
const pg = require('pg');


var app = express();

app
  // .use(express.json()) // for parsing application/json
  // .use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
  // .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json({limit: '50mb'}))
  // .set('views', path.join(__dirname, 'views'))
  // .set('view engine', 'ejs')
  // .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
  
// POST Azure method route
app.post('/azure', function(req, res) {
  var data = req.body;

  var response = res.body || {};

  // Validate data using a schema.
  const v = new Validator();
  const validationResult = v.validate(data, azureSchema);

  response.isValid = (validationResult.errors.length === 0);
  if (response.isValid !== true) {
    response.errors = validationResult.errors;
    res.status(500).json(response);
    return;
  }

  const config = {
      host: `${data.serverName}.postgres.database.azure.com`,
      user: data.username,     
      password: data.password,
      database: data.nameOfDB,
      port: 5432,
      ssl: true
  };

  const client = new pg.Client(config);

  client.connect(err => {
      if (err) res.status(500).json({resultMsg: err});
      else {
        client
            .query(data.query)
            .then(() => {
                console.log('Table created successfully!');
                client.end(console.log('Closed client connection'));
            })
            .catch(err => res.status(500).json({resultMsg: err}))
            .then(() => {
                console.log('Finished execution, exiting now');
                res.status(200).json({success: true});
                process.exit();
            });
      }
  });
});

var azureSchema = {
  "id": "/Request",
  "type": "object",
  "properties": {
      "serverName": {"type": "string"},
      "username": {"type": "string"},
      "password": {"type": "string"},
      "nameOfDB": {"type": "string"},
      "query": {"type": "string"}
  },
  "required": [
      "serverName", "username", "password", "nameOfDB", "query"
  ]
};