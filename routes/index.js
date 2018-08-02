var express = require('express');
var router = express.Router();
var conString = "";
var obj = "1";
var fs = require('fs');
var RSVP = require('RSVP');

// 
// console.log('1');
// var promise = new RSVP.Promise(function(fulfill, reject) {
//   var file = fs.readFile('./public/data/Distance_mf2.csv','UTF-8',function(error,csv){
// 
//     fulfill(csv)
// 
//   })
// 
//   console.log('123')
// });
// 
// promise.then(function(c) {
// 
//   router.get('/', function(req, res, next) {
//       res.render('index', { title: 'Job Accessibility'});
//   });
// });

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Accessibility-Gravity Model'});
});




module.exports = router;
