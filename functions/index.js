const functions = require('firebase-functions');
var rp = require('request-promise');


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


exports.takeEvent = functions.https.onRequest((req,res) => {
    console.log('call takeEvent',req.body, req.body.eventId, req.body.volunteerId, '/events/' + req.body.eventId);

    if(!req.body.eventId || !req.body.volunteerId){
        return res.status(404).send({message : "can't find volunteer or event"});
    }

    var promise = admin.database().ref('/events/' + req.body.eventId).once('value');

    return Promise.resolve(promise).then(t => {

        if (!t.hasChildren()) {
            return console.log('There are no event');
          }

        console.log('There are', t.numChildren(), 'events');
        console.log(t.val());
        console.log('found event ', t.val());

        const currentVoluneerId = t.val().assignedTo;
        if(currentVoluneerId){
            console.log('event already took by volunteer ', currentVoluneerId);
            res.status(400).send({ message: 'event already took'});
        }
        else {
             admin.database().ref('/events/' + req.body.eventId + '/assignedTo')
            .set(req.body.volunteerId)
            .then(res.status(200).send({message : 'OK!'}));
        }
    })
})

exports.sendFollowerNotification = functions.database.ref('/events/{eventId}')
    .onUpdate(event => {

    var eventData = event.data.val();
    var previousValue = event.data.previous.val();
    console.log('old is' + previousValue.status + ' new is ' + eventData.status);
    console.log(eventData);

    if(eventData.status != 'sent' ||  previousValue.status == 'sent'){
        console.log('block');
        return;
    }


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
        data : {
            event : JSON.stringify(eventData)
        }
      };

      console.log(tokens.val());
      // Listing all tokens.
      var tokenData= tokens.val();
      const tokensToSend =
        Object.keys(tokenData).map(function(t){return tokenData[t].FCMToken});

      console.log(tokensToSend);

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
  exports.sendExpoFollowerNotification = functions.database.ref('/events/{eventId}').onUpdate(event => {

        var eventData = event.data.val();
        var previousValue = event.data.previous.val();
        console.log('old is' + previousValue.status + ' new is ' + eventData.status);
        console.log(eventData);

        if(eventData.status != 'sent' ||  previousValue.status == 'sent'){
            console.log('block');
            return;
        }

        // Get the list of device notification tokens.
        const getDeviceTokensPromise = admin.database().ref('/volunteer')
            .orderByChild("NotificationToken").startAt("")
        .once('value');

        // Get the follower profile.

        return Promise.resolve(getDeviceTokensPromise).then(tokens => {
          // Check if there are any device tokens.
          if (!tokens.hasChildren()) {
            return console.log('There are no notification tokens to send to.');
          }

          console.log('There are', tokens.numChildren(), 'tokens to send notifications to.');

          console.log(tokens.val());
          // Listing all tokens.
          var tokenData= tokens.val();
          const dataToSend =

          Object.keys(tokenData).map(function(t){
            var objectToSend = {};
                objectToSend.to = tokenData[t].NotificationToken;
                objectToSend.data = { key: eventData.key };
                objectToSend.title = 'yedidim title';
                objectToSend.body = 'Body Test';
		        objectToSend.sound = 'default';
                return objectToSend;
            });

          console.log(dataToSend);

          var options = {
            method: 'POST',
            uri: 'https://exp.host/--/api/v2/push/send',
            body: dataToSend,
            headers: {
                "Content-Type": "application/json"
            },
            json: true // Automatically stringifies the body to JSON
        };

        return rp(options)
            .then(function (parsedBody) {
                console.log(parsedBody);
                // POST succeeded...
            })
            .catch(function (err) {
                console.log(err);
                // POST failed...
            });
        });
      });

