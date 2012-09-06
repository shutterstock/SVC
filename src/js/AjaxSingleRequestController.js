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
