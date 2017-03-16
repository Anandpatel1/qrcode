var os = require('os');
var fs = require("fs");
var	path = require("path");

var express = require('express');
var qr = require('qr-image');
var app = express();

app.use(express.static('public'));
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

var data_folder = "public/Data/";
var qr_folder = "public/qrcode/";

function getIPAddresses() {
	var os = require('os');
	var ifaces = os.networkInterfaces();

	var ip;
	Object.keys(ifaces).forEach(function (ifname) {
		var alias = 0;

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}

			if (alias >= 1) {
				// this single interface has multiple ipv4 addresses
				console.log(ifname + ':' + alias, iface.address);
			} else {
				// this interface has only one ipv4 adress
				console.log(ifname, iface.address);
			}
			ip = iface.address;
			++alias;
		});
	});

	return ip;
}

var ip = getIPAddresses();
console.log('IP = ', ip);
var port = 3000;
var address = 'http://' + ip + ':' + port + '/';

function regenerateQRs(cb) {
	fs.readdir(data_folder, function (err, files) {
		if (err) {
			return cb(err);
		}
		console.log("%s", files);
		files.forEach(function (file) {
			if(file !== '.gitkeep') {
				console.log(file);
				filename = qr_folder + String(file) + '.png'
				var qr_png = qr.imageSync(address + 'Data/' + file, { type: 'png' });
				fs.writeFileSync(filename, qr_png);
			}
		});
		cb(null);
	});
}

app.get("/", function (req, res) {
	regenerateQRs(function(err) {
		fs.readdir(qr_folder, function (err, files) {
			if (err) {
				throw err;
			}
			var originals = [];
			var fullFilePaths = [];
			var fileObjs = [];
			files.forEach(function(file, index) {
				if(file !== '.gitkeep') {
					original = data_folder.split('public')[1] + file.split('.png')[0];
					fullFilePath = qr_folder.split('public')[1] + file;
					fileObjs.push({qrcode: fullFilePath, original: original});
				}
			});

			fileObjs.sort(function(a, b) {
				return fs.statSync('public' + b.original).mtime.getTime() - 
						fs.statSync('public' + a.original).mtime.getTime();
			});
			
			res.render('qrcode', { title: 'Pop Noggins', fileObjs: fileObjs });
		});
	});
});

app.get('/qrcodes', function (req, res) {
	fs.readdir(qr_folder, function (err, files) {
		if (err) {
			throw err;
		}
		console.log("QRCode files: ", files);
		res.status(200).send(files);
	});
})

var server = app.listen(port, function () {

});