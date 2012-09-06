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
