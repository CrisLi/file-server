var fs = require('fs');
var path = require('path');
var express = require('express');
var http = require('http');
var morgan = require('morgan');
var multer = require('multer');
var mongoose = require('mongoose');
var grid = require('gridfs-stream');

const uploadPath = path.join(__dirname, 'uploads');
const port = process.env['PORT'] || 3000;
const mongoUrl = process.env['MONGO_URL'] || 'mongodb://localhost/reits_files';

var app = express();

var conn = mongoose.createConnection(mongoUrl);
var upload = multer({ dest: uploadPath });
var server = http.createServer(app);

app.use(morgan('combined'));

grid.mongo = mongoose.mongo;

conn.once('open', () => {

  var gfs = grid(conn.db);

  app.post('/upload', upload.single('file'), (req, res, next) => {

    var writeStream = gfs.createWriteStream({
      filename: req.file.originalname
    });

    var filename = path.join(uploadPath, req.file.filename);
    var readStream = fs.createReadStream(filename);

    writeStream.on("close", (file) => {
      fs.unlink(filename, (err) => {
        if (err) {
          throw err;
        }
        res.status(200).json(file);
      });
    });

    readStream.on("error", (err) => {
      throw err;
    });

    readStream.pipe(writeStream);
  });

  app.get("/files", (req, res) => {
    gfs.files.find().toArray((err, files) => {
      if (err) {
        throw err;
      }
      res.status(200).json(files);
    });
  });

  app.get("/files/:id", (req, res) => {
    gfs.exist({ _id: req.params.id }, (err, found) => {
      if (err) {
        throw err;
      }
      if (found) {
        var readStream = gfs.createReadStream({ _id: req.params.id });
        readStream.on("error", (err) => {
          throw err;
        });
        readStream.pipe(res);
      } else {
        console.error(`file with id ${req.params.id} not found`);
        res.status(404).json({
          code: '404',
          message: `file with id ${req.params.id} not found`
        });
      }
    });

  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
       message: err.message,
       error: err.status || 500
    });
  });

  server.listen(port, () => {
    console.log(`Express server up and running on port ${port}`);
  });

});
