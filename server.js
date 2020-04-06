const { createServer } = require('http');
const { stat, createReadStream, createWriteStream } = require('fs');
const fileName = './videos/F35.mp4';
const { promisify } = require('util');
const multiparty = require('multiparty');
const fileInfo = promisify(stat);

const ResponseWithVideo = async (req, res) => {
  const { size } = await fileInfo(fileName);
  const range = req.headers.range;
  if (range) {
    let [start, end] = range.replace(/bytes=/, '').split('-');
    start = parseInt(start, 10);
    end = end ? parseInt(end, 10) : size - 1;
    // 206 status code is partial data
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-LengthL': end - start + 1,
      'Content-Type': 'video/mp4',
    });
    createReadStream(fileName, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': size,
      'Content-Type': 'video/mp4',
    });
    createReadStream(fileName).pipe(res);
  }
};

createServer((req, res) => {
  if (req.method === 'POST') {
    let form = new multiparty.Form();
    form.on('part', (part) => {
      part
        .pipe(createWriteStream(`./videos/${part.filename}`))
        .on('close', () => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<h1>File Uploaded: ${part.filename} </h1>`);
        });
    });
    form.parse(req);
  } else if (req.url === '/video') {
    ResponseWithVideo(req, res);
  } else {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(`
        <form enctype="multipart/form-data" method="POST" action="/">
            <input type="file" name="upload-file" />
            <button> Upload File </button>
        </form>
      `);
  }
}).listen(3000, () => {
  console.log('Server Running! - 3000');
});
