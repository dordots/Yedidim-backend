
let GeoFire = require('geofire');

let addLocation = (key, location) => {
    return geoFire.set(key, location).then(() => {
        console.log('Update succesfull');
    }).catch(error => {
        console.log(error);
    });
}

exports.handle = (req, res, admin) => {
    let geoFire = new GeoFire(admin.database().ref('/geolocations'));
    console.log('Update GeoFire', req.body.latitude, req.body.longtitude, req.body.id);
    return addLocation(req.body.id, [parseFloat(req.body.latitude), parseFloat(req.body.longtitude)])
        .then(res.send('OK!'));
};