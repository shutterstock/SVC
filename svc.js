(function (namespace, version){

	if (typeof(namespace) === "undefined") {
		namespace = {};
	} else if (! (typeof(namespace) === "object" || typeof(namespace) === "function")) {
		throw "Failed to initialize SVC - invalid namespace";
	}

	var svc = namespace.svc = {};
	svc.VERSION = version;

	//Function shortcuts
	var fromArguments = Array.prototype.slice;
	var emptyFunction = function () {};
// Subject
// --------------

// The main work horse of our framework. This is a stripped down version of the Subject; it provides a very
// simple equality test, the ability to destroy itself, notify events, and subscribe to/unsubscribe from
// any notifications.
svc.Subject = Class.create({
	// Our constructor just sets up the mapping from notifcations to functions.
	initialize: function (args) {
		this._notificationToObservers = {};
	},

	// Equality test is just a strict equals against another `subject` at this point.
	isEqual: function (subject) {
		return this === subject;
	},

	// Destroy self. Notify that we are dead, and clear out all subscribed functions.
	destroy: function () {
		this.notify('subject:destroy');
		this._notificationToObservers = {};
	},

	// Retrieve all the registered notifications
	notifications: function () {
		return _.keys(this._notificationToObservers);
	},

	// Retrieve all the registered observers
	observers: function () {
		return _.chain(this._notificationToObservers).values().flatten().uniq().value();
	},

	// Notify that a particular `notification` happened. The first variable passed along will be the subject.
	notify: function (notification) {
		var observers = this._notificationToObservers[notification];
		var args = fromArguments.call(arguments);

		// Remove the notification from the arguments array.
		args.shift();

		// Add the subject as the first argument.
		args.unshift(this);

		if (observers) {
			_.invoke(observers, 'apply', args);
		}
	},

	// Add a subscription of a `f`unction call for a particular `notification`.
	subscribe: function (notification, f) {
		var observers = this._notificationToObservers[notification];

		if (observers) {
			observers.push(f);
		} else {
			this._notificationToObservers[notification] = [f];
		}
	},

	// Remove a subscription of a `f`unction call for a particular `notification`.
	unsubscribe: function (notification, f) {
		var observers = this._notificationToObservers[notification];

		if (observers) {
			this._notificationToObservers[notification] = _.without(observers, f);
		}
	}
});
// ModifiableSubject
// ------

// ModifiableSubject is a more specific implementation of the subject, which provides the ability to set
// attributes and sending out default events for those events. It maintains flags to watch the state of the
// object.
svc.ModifiableSubject = Class.create(svc.Subject, {
	// Create the object, setting the dirty flag to false.
	initialize: function ($super, args) {
		$super(args);
		
		this._dirty = false;
		
		// TODO: automatically do silent sets for all values in args that aren't reserved
	},

	// Retrieve the particular value of a `property`.
	get: function (property) {
		return this[':' + property];
	},

	// Get all the `properties` for a ModifiableSubject.
	properties: function () {
		var properties = []; 
		for (var property in this) {
			if (property.charAt(0) === ':') {
				properties.push(property.slice(1));
			}
		}
		return properties;
	},

	// Set the object to be `clean` again. Notifies `subject:clean`.
	clean: function () {
		this._dirty = false;
		this.notify('subject:clean');
	},

	// Set the object to be `dirty`. Notifies `subject:dirty`.
	dirty: function () {
		this._dirty = true;
		this.notify('subject:dirty');
	},

	// Set a `property` to a particular `value`. If the `silent` flag is set, then no notification will be
	// made. If it isn't set (or is not included), the notification will be `subject:change:<property>`.
	// Returns true if the value is changed.
	set: function (property, value, silent) {
		if (this.get(property) == value) { return false; }
		this[':' + property] = value;
		if (! silent) {
			this.notify('subject:change:' + property);
			this.dirty();
		}
		return true;
	},

	// Checks to see if the object has changes.
	isDirty: function () {
		return this._dirty;
	}
});
// Collection
// --------------

// `Collection`s are made up of `Subject`s, but are subjects as well. `Collection`s are useful for storing
// all relevant subjects and applying notifcations to all items in the collection.
svc.Collection = Class.create(svc.Subject, {
		// Our constructor expects one variable labeled `collection`, which can
		// be an array of subjects. It also can take a `sortFunction` that can be used to sort the collection
	initialize: function ($super, args) {
		$super(args);
		this._collection = args.collection || [];
		this._sortFunction = args.sortFunction;
		if (this._sortFunction) {
			_.sortBy(this._collection, this._sortFunction);
		}
	},

	// Get a value in the `Collection` from a particular `index`. Will throw errors for bad indices.
	at: function (index) {
		if (! this.inRange(index)) {
			throw 'svc.Collection.at: invalid index.';
		}
		return this._collection[index];
	},

	// Get a particular `subject` from the `collection`. Uses the `subject`s isEqual property to get the object,
	// returns `null` if nothing is found.
	get: function (subject) {
		return _.find(this._collection,
			function (entry) {
				return entry.isEqual(subject);
			}
		);
	},

	// Return all items in the collection.
	getAll: function () {
		return this._collection;
	},

	// Determines where a `subject` is in the `collection`. Uses the `subject`s isEqual property to get the object,
	// and will return -1 if not found.
	indexOf: function (subject) {
		var index = -1;
		_.find(this._collection,
			function (entry) {
				++index;
				return entry.isEqual(subject);
			}
		);

		return index === this.length ? -1 : index;
	},

	// Determines whether or not an index fits into the `collection`.
	inRange: function (index) {
		return index >= 0 && index < this.length;
	},

	// Returns the size of the collection.
	size: function () {
		return this._collection.length;
	},

	// Add a `subject` to the `collection` if it isn't already in the `collection`.
	add: function (subject) {
		if (this.get(subject)) { return; }
		this._collection.push(subject);
		if (this._sortFunction) {
			_.sortBy(this._collection, this._sortFunction);
		}
		this.notify('collection:add', subject);
		subject.notify('collection:add');
	},

	// Remove all `subject`s from the `collection`.
	clear: function () {
		var cleared = this.getAll();
		this._collection = [];
		_.invoke(cleared, 'notify', 'collection:clear');
		this.notify('collection:clear');
	},

	// Remove a single `subject` from the `collection`.
	remove: function (subject) {
		var entry = this.get(subject);
		if (! entry) { return; }
		this._collection = _.without(this._collection, entry);
		entry.notify('collection:remove');
		this.notify('collection:remove', entry);
		return entry;
	}
});
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

	// Clear out all subscribed functions for the view.
	unsubscribeAll: function () {
		_.chain(_.keys(this._subscribedFunctions)).each(_.bind(this.unsubscribe, this));
	}
});
// ActionView
// -----------

// `ActionView`s modify the model based on user input. Subclasses must implement a `draw` method (from the
// `View` class) and define a `field`, which is what the user interacts with. They also should define
// a list of `events` that the field should respond to.
svc.ActionView = Class.create(svc.View, {

	// Our initializer takes an `action`, `controller`, and `events` along with the variables a `View` needs. The
	// `controller` is a `Controller` object and the `action` is the name of the function you wish to call
	// when the user completes the required action. Users define `events` that the view will respond to.
	initialize: function ($super, args) {

		this._action = args.action;
		this._controller = args.controller;

		// `field` gets set in draw()
		this._field = null;

		$super(args);

		// We store the fire function so it can be unregistered later.
		this._boundFireFunction = _.bind(this.fire, this);

		this.observeDOMEvents(args.events);
	},

	// Get the `ActionView`s `field`.
	getField: function () {
		return this._field;
	},

	// We associate the passed in `events` with the view so that the view will call out to the controller
	// when it's interacted with.
	observeDOMEvents: function (events) {
		// We don't operate on `ActionView`s without fields.
		if (! this.getField()) {
			return;
		}

		if (!_.isArray(events)) {
			events = [events];
		}

		_.chain(events).uniq().compact().each(
			_.bind(function (event) {
				this.getField().observe(event, this._boundFireFunction);
			}, this)
		);
	},

	// We call the desired `action` in the `controller` and include the `subject` as the first variable.
	fire: function () {
		var args = fromArguments.call(arguments);
		args.unshift(this.getSubject());
		this._controller[this._action].apply(this._controller, args);
	}
});
// Controller
// --------------

// The base controller. It doesn't do anything, except provide an inheritence chain.
svc.Controller = Class.create({
	initialize: function (args) {
	}
});

})(null || (function(){ return this; })(), "2.0");
