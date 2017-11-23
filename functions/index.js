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
        if (event.data.previous.exists()) {
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
        if (!mobilePhone || mobilePhone.length === 0) {
            return;
        }


        return admin.database().ref('/phones/' + mobilePhone).set(1);

    });

exports.setLocation = functions.https.onRequest((req, res) => {
    console.log('Update GeoFire', req.body.latitude, req.body.longtitude, req.body.id);
    addLocation(req.body.id, [parseFloat(req.body.latitude), parseFloat(req.body.longtitude)])
        .then(res.send('OK!'));
});


exports.getVolunters = functions.https.onRequest((req, res) => {
    console.log('call getVolunters', req.body.latitude, req.body.longtitude, req.body.callId);
    
    var geoQuery = geoFire.query({
        center: [req.body.latitude, req.body.longtitude],
        radius: 3000
      });

    geoQuery.on("key_entered", function(key, location) {
        log(key + " entered the query. Hi " + key + "!");
      });

      geoQuery.on("ready", function() {
        log("*** 'ready' event fired - cancelling query ***");
        geoQuery.cancel();
        res.send('OK!')
      })

});

exports.sendFollowerNotification = functions.database.ref('/events').onWrite(event => {
    // Get the list of device notification tokens.
    const getDeviceTokensPromise = admin.database().ref('/volunteer')
        .orderByChild("FCMToken").startAt("")
    .once('value');
  
    // Get the follower profile.
  
    return Promise.resolve(getDeviceTokensPromise).then(tokens => {
      // Check if there are any device tokens.
      if (!tokens.hasChildren()) {
        return console.log('There are no notification tokens to send to.');
      }

      console.log('There are', tokens.numChildren(), 'tokens to send notifications to.');
  
      // Notification details.
      const payload = {
        notification: {
          title: 'Yedidim',
          body: event.details.full_address
        },
        data : event.details
      };
  
      // Listing all tokens.
      const tokensToSend = Object.keys(tokens.val());
  
      // Send notifications to all tokens.
      return admin.messaging().sendToDevice(tokensToSend, payload).then(response => {
        // For each message check if there was an error.
        //const tokensToRemove = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error('Failure sending notification to', tokensToSend[index], error);
            // Cleanup the tokens who are not registered anymore.
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
              //tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
            }
          }
        });
        //return Promise.all(tokensToRemove);
      });
    });
  });
