exports.handle = (req,res,admin) => {
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

            admin
            .database()
            .ref('/events/' + req.body.eventId + '/status')
            .set('assigned')
            .then(res.status(200).send({message : 'OK!'}));
        }
    })
}
