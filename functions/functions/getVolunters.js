let GeoFire = require('geofire');

exports.handle = (req, res,admin) => {
    let geoFire = new GeoFire(admin.database().ref('/geolocations'));
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

};