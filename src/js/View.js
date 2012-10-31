// View
// --------------

// The base View class of the SVC. It will automatically make a call to 'draw' the element on the page.
// If the element is already on the page, this function can be used to locate and store pointers to the
// elements on the page. It also handles destroying itself when told to. It provides some often used
// getter methods and also provides methods to subscribe to (and unsubscribe from) nofitications from
// the subject.

svc.View = Class.create({
	// Our constructor calls draw and subscribes a teardown method to the destroy event. It requires a
	// `subject` variable which will be the `Subject` the view subscribes to.
	initialize: function (args) {
		this._subject = args.subject;
		this._element = this.draw();

		this._subscribedFunctions = {};
		this.subscribe('subject:destroy', _.bind(this.tearDown, this));
	},

	// This will be where you define the main element of a view, you can also define other elements
	// which can be stored as instance variables to reduce page wide scans.
	draw: function () {
		throw "View.js: draw must be defined in a subclass.";
	},

	// This will need to go, but is required for now.
	update: function () {
		// stub method, needs to be impemented in subclasses as well.
	},

	// The default method that gets called when the subject is destroyed. It removes the element
	// from the page and unsubscribes all events. Feel free to override it as needed.
	tearDown: function () {
		var element = this.getElement();
		if (element) {
			element.hide();
			var parentElement = element.parentNode;
			if (parentElement) { parentElement.removeChild(element); }
		}

		this.unsubscribeAll();
	},

	// Gets the main `element` of the view.
	getElement: function () {
		return this._element;
	},

	// Get the `subject` the view is watching.
	getSubject: function () {
		return this._subject;
	},

	// Subscribe a `function` to a particular `notification` issued by the subject.
	subscribe: function (notification, fn) {
		this._subscribedFunctions[notification] = fn;
		this.getSubject() && this.getSubject().subscribe(notification, fn);
	},

	// Unsubscribe from a particular `notification` issued by the `subject`.
	unsubscribe: function (notification) {
		var fn = this._subscribedFunctions[notification];
		delete this._subscribedFunctions[notification];
		this.getSubject() && this.getSubject().unsubscribe(notification, fn);
	},

	// get all the subscribed functions
	notifications: function () {
		return _.keys(this._subscribedFunctions);	

	},

	// Clear out all subscribed functions for the view.
	unsubscribeAll: function () {
		_.chain(_.keys(this._subscribedFunctions)).each(_.bind(this.unsubscribe, this));
	}
});
