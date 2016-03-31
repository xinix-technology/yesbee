var JSONStream = require('JSONStream');
var jsonStream = JSONStream.parse();
jsonStream.on('data', function(data) {
  data.body = 'hello ' + data.body;
  console.log(JSON.stringify(data));
});

process.stdin.pipe(jsonStream);