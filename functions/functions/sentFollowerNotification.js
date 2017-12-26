exports.handle = (event,admin) => {
	var eventData = event.data.val();
	var previousValue = event.data.previous.val();
	console.log('old is' + previousValue.status + ' new is ' + eventData.status);
	console.log(eventData);

	if (eventData.status != 'sent' || previousValue.status == 'sent') {
		console.log('block');
		return;
	}

	// Get the list of device notification tokens.
	const getDeviceTokensPromise = admin
		.database()
		.ref('/volunteer')
		.orderByChild('FCMToken')
		.startAt('')
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
			data: {
				event: JSON.stringify(eventData)
			}
		};

		console.log(tokens.val());
		// Listing all tokens.
		var tokenData = tokens.val();
		const tokensToSend = Object.keys(tokenData).map(function(t) {
			return tokenData[t].FCMToken;
		});

		console.log(tokensToSend);

		// Send notifications to all tokens.
		return admin
			.messaging()
			.sendToDevice(tokensToSend, payload)
			.then(response => {
				// For each message check if there was an error.
				//const tokensToRemove = [];
				response.results.forEach((result, index) => {
					const error = result.error;
					if (error) {
						console.error('Failure sending notification to', tokensToSend[index], error);
						// Cleanup the tokens who are not registered anymore.
						if (
							error.code === 'messaging/invalid-registration-token' ||
							error.code === 'messaging/registration-token-not-registered'
						) {
							//tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
						}
					}
				});
				//return Promise.all(tokensToRemove);
			});
	});
};
