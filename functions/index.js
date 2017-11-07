const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
'use strict';

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let GeoFire = require('geofire');
let geoFire = new GeoFire(admin.database().ref('/geolocations'));
let addLocation = (key, location) => {
        return geoFire.set(key, location).then(() => {
            console.log('Update succesfull');
        }).catch(error => {
            console.log(error);
        });
    }

exports.onUserCreateTrigger = functions.database.ref('/volunteer/{id}')
    .onWrite(event => {
        if(event.data.previous.exists()){
            console.log('already exists');
            return;
        }

      // Exit when the data is deleted.
      if (!event.data.exists()) {
        return;
      }

        const original = event.data.val();
        console.log(original);
        const mobilePhone = original.MobilePhone;
        console.log(mobilePhone);
        if(!mobilePhone || mobilePhone.length === 0){
            return;
        }

        
        return admin.database().ref('/phones/' + mobilePhone).set(1);
        
    });
    
    exports.setLocation = functions.https.onRequest((req, res) => {
        console.log('Update GeoFire', req.body.latitude, req.body.longtitude, req.body.id);
        addLocation(req.body.id, [parseFloat(req.body.latitude),parseFloat(req.body.longtitude)])
            .then(res.send('OK!'));
      });
