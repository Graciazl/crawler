/**
 * Created by Gracia on 17/2/13.
 */

var http = require('http'),
    URL = require('url'),
    cheerio = require('cheerio'),
    fs = require('fs');

var originalURL = [
    'http://info.yorkbbs.ca/default/tax',
    'http://info.yorkbbs.ca/default/zhusu'
];

function loadHttp(url) {
    var options = URL.parse(url);

    options.headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
    };

    return new Promise(function (resolve, reject) {
        http.get(options, function (response) {
            var html = '';
            response.on('data', function (data) {
                html += data;
            });

            response.on('end', function () {
                resolve(html);
            });
        });
    });
}

function getDom(html) {
    return new Promise(function (resolve, reject) {
        var body = cheerio.load(html);
        resolve(body);
    });
}