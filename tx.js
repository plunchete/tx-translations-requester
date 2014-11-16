var phantom = require('phantom');
var readline = require('readline');
var colors = require('colors');
var S = require('string');
var fs = require('fs');
var path = require('path');

var _page,
    username,
    password,
    organizationName,
    conf,
    languagesToTranslate,
    languages,
    translationVendor,
    proQuality;


var rl = readline.createInterface(process.stdin, process.stdout);

var txConf = fs.readFileSync(getUserHome() + '/.transifexrc', 'utf8').split('\n');

for(var i = 0, size = txConf.length; i < size; i++) {
    var line = txConf[i].trim();

    if (S(line).startsWith('password')) {
        password = line.substring(line.indexOf('=') + 1).trim();
    } else if (S(line).startsWith('username')) {
        username = line.substring(line.indexOf('=') + 1).trim();
    }
}

conf = JSON.parse(fs.readFileSync(__dirname + path.sep + 'conf.json'));
languagesToTranslate = conf.languagesToTranslate;
languages = conf.languages;
translationVendor = conf.translationVendor;
proQuality = conf.proQuality;

function getUserHome() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

phantom.create('--ignore-ssl-errors=yes', '--ssl-protocol=any', function (ph) {
    ph.createPage(function (page) {
        _page = page;

        _page.onConsoleMessage(function(msg) {
            //console.log('Console msg: ' + msg);
            if (S(msg).startsWith('-- Price calculated: ')) {
                checkPrice(msg.substring(msg.indexOf('$')).trim());
            }
        });

        var doLogin = function() {
            console.log('- Going to log in');
            _page.evaluate(function(username, password) {
                $('#id_identification').val(username);
                $('#id_password').val(password);
                $('input[value="Log in"]').click();
            }, function () {}, username, password);

        };

        var checkPrice = function(price) {
            if (price == '$0.00') {
                console.log('Noting to translate'.underline + '. Quote ' + price.green);
                exit();
            }
            rl.question("The price for the new translations is: " + price.magenta + ". Do you want to continue? (y/n)\n", function(response) {
                if (response === 'y') {
                    requestTranslations();
                } else if (response === 'n') {
                    exit();
                } else {
                    console.log('Incorrect option. Please try again.');
                    checkPrice(price);
                }
            });


        };

        var calculateCost = function () {
            console.log('- Going to calculate the cost.');
            console.log('\t- Languages: ' + languagesToTranslate.join(', '));
            console.log('\t- Translation vendor: ' + S(translationVendor).capitalize());
            console.log('\t- Quality: ' + (proQuality ? 'Pro' : 'Standard'));
            page.evaluate(function fun(languages, languagesToTranslate, proQuality) {
                $('[data-project-slug="talentbin"]').prev().click();

                for (var i = 0, languagesCount = languagesToTranslate.length; i < languagesCount; i++) {
                    $('input[value=' + languages[languagesToTranslate[i]] + ']').click();
                }

                if (proQuality) {
                    $('#id_tier').val("pro");
                }

                $('.op-calculate').click();

                //Check until order now is visible -- aka wait until the price is calculated to continue
                (function checkOrderNow() {
                    if ($('#order-btn').is(":visible")) {
                        console.log('-- Price calculated: ' + $('#js-price .js-price_text').text());
                    } else {
                        setTimeout(checkOrderNow, 500);
                    }
                })();
            }, function(result) {}, languages, languagesToTranslate, proQuality);
        };

        var requestTranslations = function () {
            console.log('- Requesting translations');
            _page.evaluate(function() {
                $('#order-btn').click();
                $('#confirm-vendorsorder #confirmation-yes').click();
            });
        };

        var exit = function () {
            _page.release();
            ph.exit();
            process.exit();
        };


        _page.set('onLoadFinished', function(success) {
            _page.get('url', function (url) {
                // If the organization name is not there we want to extract it form the URL
                //This is the first url that Transifex redirects your after login in
                if (!organizationName && S(url).startsWith('https://www.transifex.com/organization/') && S(url).endsWith('/dashboard')) {
                    organizationName = url.substring('https://www.transifex.com/organization/'.length, url.length - '/dashboard'.length);
                }

                if (url == 'https://www.transifex.com/signin/') {
                    doLogin();
                } else if (url == 'https://www.transifex.com/organization/' + organizationName + '/dashboard') {
                    page.open('https://www.transifex.com/organization/' + organizationName + '/translation/order/' + translationVendor + '/');
                } else if (url == 'https://www.transifex.com/organization/' + organizationName + '/translation/order/' + translationVendor + '/') {
                    calculateCost();
                } else if (url == 'https://www.transifex.com/organization/' + organizationName + '/translation/history/') {
                    console.log('- Translations requested. Bye!');
                    exit();
                }
            });
        });
        _page.open('https://www.transifex.com/signin/');
    });
});
