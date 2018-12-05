var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Accessibility-Gravity Model'}); //send title to the web page
});

module.exports = router;
