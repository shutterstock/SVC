(function (namespace, version){

	if (typeof(namespace) === "undefined") {
		namespace = {};
	} else if (! (typeof(namespace) === "object" || typeof(namespace) === "function")) {
		throw "Failed to initialize SVC - invalid namespace";
	}

	var svc = namespace.svc = {};
	svc.VERSION = version;
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
		var properties = $A();
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
		this._collection = $A(args.collection || []);
		this._sortFunction = args.sortFunction;
		if (this._sortFunction) {
			this._collection.sort(this._sortFunction);
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
		return this._collection.find(
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
		this._collection.find(
			function (entry) {
				++index;
				return entry.isEqual(subject);
			}
		);

		return index === this.size() ? -1 : index;
	},

	// Determines whether or not an index fits into the `collection`.
	inRange: function (index) {
		return index >= 0 && index < this.size();
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
			this._collection.sort(this._sortFunction);
		}
		this.notify('collection:add', subject);
		subject.notify('collection:add');
	},

	// Remove all `subject`s from the `collection`.
	clear: function () {
		var cleared = this.getAll();
		this._collection = $A();
		cleared.invoke('notify', 'collection:clear');
		this.notify('collection:clear');
	},

	// Remove a single `subject` from the `collection`.
	remove: function (subject) {
		var entry = this.get(subject);
		if (! entry) { return; }
		this._collection = this._collection.without(entry);
		entry.notify('collection:remove');
		this.notify('collection:remove', entry);
		return entry;
	},

	_each: function (iterator) {
		this._collection._each(iterator);
	}
});

// Mixin `Enumerable` functionality.
svc.Collection.addMethods(Enumerable);
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

		this._subscribedFunctions = $H();
		this.subscribe('subject:destroy', this.tearDown.bind(this));
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
		this._subscribedFunctions.set(notification, fn);
		this.getSubject() && this.getSubject().subscribe(notification, fn);
	},
	
	// Unsubscribe from a particular `notification` issued by the `subject`.
	unsubscribe: function (notification) {
		var fn = this._subscribedFunctions.get(notification);
		this._subscribedFunctions.unset(notification);
		this.getSubject() && this.getSubject().unsubscribe(notification, fn);
	},
	
	// Clear out all subscribed functions for the view.
	unsubscribeAll: function () {
		this._subscribedFunctions.keys().each(this.unsubscribe.bind(this));
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
		this._boundFireFunction = this.fire.bind(this);

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

		if (!Object.isArray(events)) {
			events = [events];
		}

		events.uniq().compact().each(
			function (event) {
				this.getField().observe(event, this._boundFireFunction);
			}.bind(this)
		);
	},

	// We call the desired `action` in the `controller` and include the `subject` as the first variable. 
	fire: function () {
		var args = $A(arguments);
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

// AjaxController
// ------------

// A wrapper around prototypes `Ajax.Request` object, this allows us to override methods and 
// set default values such as post method and path in an object-based format.
svc.AjaxController = Class.create(svc.Controller, {
		
	// Our initializer takes an `actionMethod` and an `actionPath` in order to define how
	// we communicate with the server and where we talk to.
	initialize: function ($super, args) {
		$super(args);
		this._actionPath   = args.actionPath;
		this._actionMethod = args.actionMethod || 'post';
	},

	// Make a request to the `path` on the server, passing whatever `args` are included as parameters.
	// We're adding a `callback` here to be called `onComplete`, but we should really rethink this.
	makeRequest: function (args, callback) {
		var boundOnSuccess = this.onSuccess.bind(this);
		var wrappedSuccess = callback && typeof(callback) === 'function' ? boundOnSuccess.wrap(callback).bind(this) : boundOnSuccess;
		var req = new Ajax.Request(this.path(), {
			method:     this.method(),
			parameters: this.parameters().update(args),
			onCreate:   this.onCreate.bind(this),
			onSuccess:  wrappedSuccess,
			onFailure:  this.onFailure.bind(this),
			onComplete: this.onComplete.bind(this)
		});
	},

	// Defines the `method` of the request (usually `POST` or `GET`).
	method: function () {
		if (! this._actionMethod) { throw "AjaxController.js: method must be defined"; }
		return this._actionMethod;
	},

	// The method called when the AJAX request is completed.
	onComplete: Prototype.emptyFunction,
	
	// The method called when the AJAX request is created.
	onCreate:   Prototype.emptyFunction,
	
	// The method called when the AJAX request fails.
	onFailure:  Prototype.emptyFunction,
	
	// The method called when the AJAX request succeeds.
	onSuccess:  Prototype.emptyFunction,
	
	// An object representing the parameters, this should be extended or overwritten.
	parameters: function () { return $H(); },

	// Retrieves the `actionPath` of the request.
	path: function () {
		if (! this._actionPath) { throw "AjaxController.js: path must be defined"; }
		return this._actionPath;
	}
});
// AjaxSingleRequestController
// -------------

// This creates a simple mutex lock on AJAX queries so that only one happens at a time. It inherits from
// the normal `AjaxController`
svc.AjaxSingleRequestController = Class.create(svc.AjaxController, {
	// Our initializer is the same as `AjaxController`.
	initialize: function ($super, args) {
		$super(args);
		this._inProgress = false;
	},
	
	// Make a request if nothing is in progress.
	makeRequest: function ($super, args, callback) {
		if (this._inProgress) { return; }
		this._inProgress = true;
		$super(args, callback);
	},

	// When the request finishes, unlock the progress lock
	onComplete: function () { this._inProgress = false; }
});
})(null || (function(){ return this; })(), "1.2");
