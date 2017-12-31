const express = require('express')
const app = express()
var port = 8888;

// app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  // res.send('Hello World!')
  res.render('index');
})

app.listen(port, function () {
  console.log('Example app listening on port ' + port + '!')
})
