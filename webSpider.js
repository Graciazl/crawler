/**
 * Created by Gracia on 17/2/13.
 */

var http = require('http'),
    URL = require('url'),
    iconv = require('iconv-lite'),
    cheerio = require('cheerio'),
    fs = require('fs');

var originalURL = [
    'http://info.yorkbbs.ca/default/tax',
    'http://info.yorkbbs.ca/default/zhusu',
    'http://www.51.ca/service/servicedisplay.php?s=218a1f619be430d93fbfa1872669596e&serviceid=9',
    'http://www.51.ca/service/servicedisplay.php?s=218a1f619be430d93fbfa1872669596e&serviceid=3'
];

var file = 'imgs.jpg';

/*
 var keys = [name, category, tags, contact, avartar, phone, phone2, language, email, serviceArea, address, postalCode, coordinates, homepage, htmlDescription, plainDescription, uploadImages, externalImages, url, id];
 */

function loadHttp(url) {
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
                /*                var decodeHtml = iconv.decode(Buffer.concat(html), 'gb2312');*/
                var decodeHtml = html.toString('utf8');
                resolve(decodeHtml);
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

function getUrlList(body, ele) {
    return new Promise(function (resolve, reject) {
        var $ = body,
            urlList = [];

        var items = $(ele).get().length;

        for (var item = 0; item < items; item++) {
            var url = $(ele).eq(item).siblings().attr('href');
            urlList.push(url);
        }

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

        resolve(content);
    });
}

function getContent51CA(body) {
    return new Promise(function (resolve, reject) {
        var $ = body,
            content = {};

        content.name = $('.MainTitle').text();
        content.category = getValue('.ColumnTitle', 0);
        ;
        content.tags = '';
        content.contact = getValue('.ColumnTitle', 3);
        content.phone = getValue('.ColumnTitle', 4);
        content.phone2 = getValue('.ColumnTitle', 6);
        content.language = '';
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
        content.id = '';

        function getValue(ele, index) {
            return $(ele).eq(index).parent().text().split('】')[1];
        }

        resolve(content);
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

function saveImage(img) {
    fs.writeFile(file, img, 'binary', function (err) {
        if (err) {
            reject(err);
        } else {
            console.log('Data has been saved successfully.');
        }
    });
}