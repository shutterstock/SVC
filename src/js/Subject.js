// Subject 
// --------------

// The main work horse of our framework. This is a stripped down version of the Subject; it provides a very
// simple equality test, the ability to destroy itself, notify events, and subscribe to/unsubscribe from
// any notifications.
svc.Subject = Class.create({
	// Our constructor just sets up the mapping from notifcations to functions.
	initialize: function (args) {
		this._notificationToObservers = $H();
	},

	// Equality test is just a strict equals against another `subject` at this point. 
	isEqual: function (subject) {
		return this === subject;
	},

	// Destroy self. Notify that we are dead, and clear out all subscribed functions.
	destroy: function () {
		this.notify('subject:destroy');
		this._notificationToObservers = $H();
	},

	// Notify that a particular `notification` happened. The first variable passed along will be the subject.
	notify: function (notification) {
		var observers = this._notificationToObservers.get(notification);
		var args = $A(arguments);
		
		// Remove the notification from the arguments array.
		args.shift();
		
		// Add the subject as the first argument.
		args.unshift(this);

		if (observers) {
			observers.invoke('apply', null, args);
		}
	},

	// Add a subscription of a `f`unction call for a particular `notification`.
	subscribe: function (notification, f) {
		var observers = this._notificationToObservers.get(notification);

		if (observers) {
			observers.push(f);
		} else {
			this._notificationToObservers.set(notification, [f]);
		}
	},

	// Remove a subscription of a `f`unction call for a particular `notification`.
	unsubscribe: function (notification, f) {
		var observers = this._notificationToObservers.get(notification);

		if (observers) {
			this._notificationToObservers.set(notification, observers.without(f));
		}
	}
});
