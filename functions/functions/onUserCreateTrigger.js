exports.handle = (event, admin) => {
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

	return admin
		.database()
		.ref('/phones/' + mobilePhone)
		.set(1);
};
