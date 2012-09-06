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
			}, this);
		);
	},

	// We call the desired `action` in the `controller` and include the `subject` as the first variable.
	fire: function () {
		var args = fromArguments.call(arguments);
		args.unshift(this.getSubject());
		this._controller[this._action].apply(this._controller, args);
	}
});
