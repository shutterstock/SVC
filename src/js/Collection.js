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
