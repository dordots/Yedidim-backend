const functions = require('firebase-functions');


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
('use strict');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

let setLocation = require('./functions/setLocation');
let getVolunters = require('./functions/getVolunters');
let takeEvent = require('./functions/takeEvent');
let sendFollowerNotification = require('./functions/sentFollowerNotification');
let sendExpoFollowerNotification = require('./functions/sendExpoFollowerNotification');
let onUserCreateTrigger = require('./functions/onUserCreateTrigger');

exports.onUserCreateTrigger = functions.database.ref('/volunteer/{id}').onWrite(event => {
	onUserCreateTrigger.handle(event, admin);
});

exports.setLocation = functions.https.onRequest((req, res) => {
	return setLocation.handle(req, res, admin);
});

exports.getVolunters = functions.https.onRequest((req, res) => {
	return getVolunters.handle(req, res, admin);
});

exports.takeEvent = functions.https.onRequest((req, res) => {
	return takeEvent.handle(req, res, admin);
});

exports.sendFollowerNotification = functions.database.ref('/events/{eventId}').onUpdate(event => {
	sendFollowerNotification.handle(event, admin);
});

exports.sendExpoFollowerNotification = functions.database.ref('/events/{eventId}').onUpdate(event => {
	sendExpoFollowerNotification.handle(event,admin);
});
