var fs = require('fs');
if (fs.existsSync('temp')) {
    fs.unlinkSync('./temp/i18njs.js');
    fs.rmdirSync('./temp/');
}
