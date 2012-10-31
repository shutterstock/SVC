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
		var boundOnSuccess = _.bind(this.onSuccess, this);
		var wrappedSuccess = callback && typeof(callback) === 'function' ? _.bind(_.wrap(boundOnSuccess, callback), this) : boundOnSuccess;
		$.ajax(
			{
				data: _.extend(this.parameters(), args),
				dataType: 'json',
				type: this.method(),
				url: this.path(),
				success: wrappedSuccess,
				complete: _.bind(this.onComplete, this),					
				error: _.bind(this.onFailure, this)
			}
		);
	},

	// Defines the `method` of the request (usually `POST` or `GET`).
	method: function () {
		if (! this._actionMethod) { throw "AjaxController.js: method must be defined"; }
		return this._actionMethod;
	},

	// The method called when the AJAX request is completed.
	onComplete: function () {},
	
	// The method called when the AJAX request is created.
	onCreate:   function () {},
	
	// The method called when the AJAX request fails.
	onFailure:  function () {},
	
	// The method called when the AJAX request succeeds.
	onSuccess:  function () {},
	
	// An object representing the parameters, this should be extended or overwritten.
	parameters: function () { return {}; },

	// Retrieves the `actionPath` of the request.
	path: function () {
		if (! this._actionPath) { throw "AjaxController.js: path must be defined"; }
		return this._actionPath;
	}
});
