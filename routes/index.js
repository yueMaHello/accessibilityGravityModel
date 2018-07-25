var express = require('express');
var router = express.Router();
var conString = "";
var obj = "1";
/* GET home page. */

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Accessibility'});
});





module.exports = router;
