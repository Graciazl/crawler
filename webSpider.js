/**
 * Created by Gracia on 17/2/13.
 */

var http = require('http'),
    URL = require('url'),
    iconv = require('iconv-lite'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path');

var originalURL = [
    'http://info.yorkbbs.ca/default/tax',
    'http://info.yorkbbs.ca/default/zhusu',
    'http://www.51.ca/service/servicedisplay.php?s=218a1f619be430d93fbfa1872669596e&serviceid=9',
    'http://www.51.ca/service/servicedisplay.php?s=218a1f619be430d93fbfa1872669596e&serviceid=3'
];

var key = 'localImages',
    eleYork = '.item-sort',
    ele51CA = '.itempos',
    prefixYork = 'info.yorkbbs.ca',
    prefix51CA = 'www.51.ca/service/';

function loadHttp(url, callback) {
    var options = URL.parse(url);

    options.headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
    };

    return new Promise(function (resolve, reject) {
        http.get(options, function (response) {
            var html = [];

            response.on('data', function (data) {
                html.push(data);
            });

            response.on('end', function () {
                var result = callback(html);

                resolve(result);
            });
        });
    });
}

function getUtf8(html) {
    return html.toString('utf8');
}

function getGb2312(html) {
    var buffer = Buffer.concat(html);
    return iconv.decode(buffer, 'gb2312');
}

function getImgBuffer(chunk) {
    return Buffer.concat(chunk);
}

function getDom(html) {
    return new Promise(function (resolve, reject) {
        var body = cheerio.load(html);
        resolve(body);
    });
}

function getUrlList(body, ele, prefix) {
    var $ = body,
        urlList = [],
        intactUrl = [];

    var items = $(ele).get().length;

    for (var item = 0; item < items; item++) {
        var url = $(ele).eq(item).siblings().attr('href');
        urlList.push(url);
    }

    intactUrl = urlList.map(function (e) {
        return path.join(prefix, e);
    });

    return intactUrl;
}

function getUrlListYorkBBS(url) {
    return new Promise(function (resolve, reject) {
        var urlList = getUrlList(url, eleYork, prefixYork);
        resolve(urlList);
    });
}

function getUrlList51CA(url) {
    return new Promise(function (resolve, reject) {
        var urlList = getUrlList(url, ele51CA, prefix51CA);
        resolve(urlList);
    });
}

function getContentYorkBBS(body) {
    return new Promise(function (resolve, reject) {
        var $ = body,
            content = {};

        content.name = $('.views > h1').text().trim();
        content.category = $('#SubCategoryName').text();
        content.tags = getTags('.item-cont-tags');
        content.contact = $('.item-views-cont').eq(0).children().first().find('span > em').first().text();
        content.phone = $('.item-cont-bigphone').children().first().text();
        content.phone2 = '';
        content.language = $('.item_cont_lg').children().text();
        content.email = $('.item-views-cont-email').children().attr('href'); // email protection
        content.serviceArea = '';
        content.address = $('.views-bigphone-address').text().trim();
        content.postalCode = '';
        content.coordinates = $('.adver-map').children().last().children().eq(0).attr('href');
        content.homepage = $('.item-views-cont').eq(0).children().last().find('span > em > a').attr('href');
        content.updateTime = $('.postmeta').children().last().text().split('：')[1];
        content.uploadImages = getImagesURL($, '.views-detail-text', 'img', 'src');
        content.localImages = '';
        content.url = '';
        content.id = $('.postmeta').children().first().text().split('：')[1];

        function getTags(ele) {
            var tagsArr = [];

            $(ele).children().each(function (index) {
                tagsArr.push($(this).text());
            });

            return tagsArr.join(',');
        }

        var result = [content, content.id, content.uploadImages];

        resolve(result);
    });
}

function getContent51CA(body) {
    return new Promise(function (resolve, reject) {
        var $ = body,
            content = {};

        content.name = $('.MainTitle').text();
        content.category = getValue('.ColumnTitle', 0);
        content.tags = '';
        content.contact = getValue('.ColumnTitle', 3);
        content.phone = getValue('.ColumnTitle', 4);
        content.phone2 = getValue('.ColumnTitle', 6);
        content.language = getLanguage('#CatTitleBox > span > img');
        content.email = $('.ColumnTitle').eq(5).siblings().attr('href').split(':')[1];
        content.serviceArea = getValue('.ColumnTitle', 7);
        content.address = getValue('.ColumnTitle', 9);
        content.postalCode = '';
        content.coordinates = $('.ColumnTitle').eq(8).siblings().attr('href');
        content.homepage = '';
        content.updateTime = getValue('.ColumnTitle', 1);
        content.uploadImages = getImagesURL($, 'body', '.picsSlideGroup', 'href');
        content.localImages = '';
        content.url = '';
        content.id = $('input[name="itemid"]').attr('value');

        function getValue(ele, index) {
            return $(ele).eq(index).parent().text().split('】')[1];
        }

        function getLanguage(ele) {
            var lan = [];

            $(ele).each(function () {
                switch ($(this).attr('src')) {
                    case 'http://www.51.ca/images/lang_e.gif':
                        lan.push('英');
                        break;

                    case 'http://www.51.ca/images/lang_m.gif':
                        lan.push('国');
                        break;

                    case 'http://www.51.ca/images/lang_c.gif':
                        lan.push('粤');
                        break;
                }
            });

            return lan.join(',');
        }

        var result = [content, content.id, content.uploadImages];

        resolve(result);
    });
}

function getImagesURL(body, ele1, ele2, attr) {
    var imgArr = [],
        $ = body;

    if ($(ele1).has(ele2)) {
        $(ele1).find(ele2).each(function (index) {
            imgArr.push($(this).attr(attr));
        });

        return imgArr.join(',');
    } else {

        return '';
    }
}

function saveImage(url, fileName) {
    loadHttp(url, getImgBuffer)
        .then(function (imgBuffer) {
            fs.writeFile(fileName, imgBuffer, function (err) {
                if (err) {
                    return reject(err);
                }
            });
        });
}

function createFolder(folder) {
    fs.mkdir(folder, function (err) {
        if (err) {
            return reject(err);
        }
    });
}

function checkFolderExists(folder) {
    fs.readdir(folder, function (err, files) {
        if (err) {
            if (err.code === 'ENOENT') {
                createFolder(folder);
            } else {
                return reject(err);
            }
        }
    });
}

function createPath(folder, url) {
    var fileName = path.basename(url);

    return path.join(folder, fileName);
}

function downloadImages(data, key) {
    var content = data[0],
        id = data[1],
        imgs = data[2],
        imgPath = [];

    if (imgs !== '') {
        var imgsUrl = imgs.split(',');

        checkFolderExists(id);

        imgsUrl.forEach(function (ele) {
            var filePath = createPath(id, ele);

            saveImage(ele, filePath);
            imgPath.push(filePath);
        });
    }

    content[key] = imgPath.join(',');

    return content;
}