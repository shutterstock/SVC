
test('svc.Subject', function () {
	// needed code for tracking notifications
	var notified = false;
	var notifyFn = function () {
		notified = true;
	};

	// our object to test
	var subject = new svc.Subject({});

	// test isEqual
	ok(subject.isEqual(subject), 'subject isEqual to itself.');

	// test notifications
	equal(subject.notifications().length, 0, 'subject has no notifications');

	// by subscribing to 'test' we should have notifications, and an array of notifications under the
	// 'test' key
	subject.subscribe('test', notifyFn);

	equal(subject.notifications().length, 1, 'subject has a notification.');
	equal(subject.notifications()[0], 'test', "subject has a notification, and it's name is 'test'.");
	equal(subject.observers().length, 1, "subject has a notification for 'test'.");
	ok(!notified, 'no notification has taken place.');

	// test notifying
	subject.notify('test');

	ok(notified, 'notification has taken place.');

	// test unsubscribing
	subject.unsubscribe('test', notifyFn);
	equal(subject.observers().length, 0, "subject has no notifications for 'test'.");

	notified = false;
	// this should do nothing
	subject.notify('test');
	equal(notified, false, "notified hasn't changed because the notification did nothing");

	subject.subscribe('test', notifyFn);
	equal(subject.observers().length, 1, "subject has a notification for 'test'.");

	// test destroy
	subject.destroy();
	equal(subject.notifications().length, 0, 'subject has no notifications.');

	// this should still do nothing
	subject.notify('test');
	equal(notified, false, "notified hasn't changed because the notification did nothing");
});

test('svc.ModifiableSubject', function () {
	// we'll track expected dirty-ness with this variable
	var isDirty = false;

	var dirtyFn = function () {
		isDirty = true;
	};

	// we'll use this to reset the flags
	var cleanFn = function () {
		isDirty = false;
		propertyChanged = false;
	};

	var propertyChanged = false;

	var propertyChangedFn = function () {
		propertyChanged = true;
	};

	var modifiableSubject = new svc.ModifiableSubject({});

	equal(modifiableSubject.isDirty(), false, "modifiableSubject is not dirty when created");

	modifiableSubject.subscribe('subject:dirty', dirtyFn);
	modifiableSubject.subscribe('subject:clean', cleanFn);
	modifiableSubject.subscribe('subject:change:property', propertyChangedFn);

	// let's make sure that silent setting works, and doesn't do any notification
	modifiableSubject.set('property', 'value', true);

	equal(modifiableSubject.isDirty(), false, "modifiableSubject is not dirty after a silent update");

	// and let's make sure that we set the property and can get it out of the modifiable subject
	equal(modifiableSubject.get('property'), 'value', "the value 'value', which was set above, is set in the object");

	// now we'll just do a normal set, which should trigger an notification and a dirty
	modifiableSubject.set('property', 'value1');
	equal(modifiableSubject.isDirty(), true, "modifiableSubject is dirty after an update");
	equal(isDirty, true, "notification has updated the isDirty flag");
	equal(propertyChanged, true, "notification has updated the propertyChanged flag");
	equal(modifiableSubject.get('property'), 'value1', "the value 'value1', which was set above, was changed in the object");

	// now we'll clean the object, which will reset all the flags, but not the value
	modifiableSubject.clean();
	equal(modifiableSubject.isDirty(), false, "modifiableSubject is no longer dirty after a clean");
	equal(isDirty, false, "notification has updated the isDirty flag");
	equal(propertyChanged, false, "notification has updated the propertyChanged flag");
	equal(modifiableSubject.get('property'), 'value1', "the value 'value1', which was set above, hasn't changed since it was last set");

	// set a bunch of values
	modifiableSubject.set('property1', 'value', true);
	modifiableSubject.set('property2', 'value', true);
	modifiableSubject.set('property3', 'value', true);

	var props = modifiableSubject.properties();
	deepEqual(props, ['property', 'property1', 'property2', 'property3'], "the properties list is correctly defined");

});


test('svc.Collection', function () {
	// needed code for tracking notifications
	var addCalls = 0, removeCalls = 0;
	var addFn = function () {
		addCalls += 1;
	};
	var removeFn = function () {
		removeCalls += 1;
	};

	// the items in our collection
	var media1 = new svc.ModifiableSubject({id:1}),
		media2 = new svc.ModifiableSubject({id:2}),
		media3 = new svc.ModifiableSubject({id:3});

	// our collection, preseeded with 1 media object
	var collection = new svc.Collection({
		collection: [media1]
	});

	// set up subscriptions
	collection.subscribe('collection:add', addFn);
	collection.subscribe('collection:remove', removeFn);

	// verify our preseeding
	equal(collection.size(), 1, "1 item in the collection");

	// verify get()
	ok(media1.isEqual(collection.get(media1)), "media1 is equal to getting media1 from the collection.");

	// try adding in the same item
	collection.add(media1);

	equal(collection.size(), 1, "Still just 1 item in the collection");
	equal(addCalls, 0, "adding an item already in the collection does nothing.");

	// try removing an item not in the collection
	collection.remove(0);

	equal(collection.size(), 1, "Still just 1 item in the collection");
	equal(removeCalls, 0, "removing an item not in the collection does nothing.");

	collection.remove(media2);

	equal(collection.size(), 1, "Still just 1 item in the collection");
	equal(removeCalls, 0, "removing an item not in the collection does nothing.");

	// remove an item in the collection
	collection.remove(media1);
	equal(collection.size(), 0, "No items in the collection");
	equal(removeCalls, 1, "removing an item in the collection notifies collection:remove.");

	// add and remove an item
	collection.add(media1);
	equal(collection.size(), 1, "1 item in the collection");
	equal(addCalls, 1, "adding an item to the collection notifies collection:add.");

	collection.remove(media1);
	equal(collection.size(), 0, "No items in the collection");
	equal(removeCalls, 2, "removing an item in the collection notifies collection:remove.");

	// add all the items
	collection.add(media1);
	equal(collection.size(), 1, "1 item in the collection");
	equal(addCalls, 2, "adding an item to the collection notifies collection:add.");

	collection.add(media2);
	equal(collection.size(), 2, "1 item in the collection");
	equal(addCalls, 3, "adding an item to the collection notifies collection:add.");

	collection.add(media3);
	equal(collection.size(), 3, "1 item in the collection");
	equal(addCalls, 4, "adding an item to the collection notifies collection:add.");

	// check all the items
	deepEqual(collection.getAll(), [media1, media2, media3], "All the items are in the collection as expected");

	// remove them in non-sequential order
	collection.remove(media2);
	equal(collection.size(), 2, "1 item in the collection");
	equal(removeCalls, 3, "removing an item in the collection notifies collection:remove.");

	deepEqual(collection.getAll(), [media1, media3], "All the items in the collection are as expected");

	collection.remove(media1);
	equal(collection.size(), 1, "1 item in the collection");
	equal(removeCalls, 4, "removing an item in the collection notifies collection:remove.");

	collection.remove(media3);
	equal(collection.size(), 0, "1 item in the collection");
	equal(removeCalls, 5, "removing an item in the collection notifies collection:remove.");
});

test('svc.View', function () {

	// set up a test view to test
	var TestView = Class.create(svc.View, {
		initialize: function ($super, args) {
			this._varName = args.varName;
			this._notified = false;
			$super(args);
		},

		draw: function () {
			return $('<div class="test"></div>');
		},

		getNotified: function () {
			return this._notified;
		},

		notified: function () {
			this._notified = true;
		},

		fakeSubscription: function () {
			// do nothing
		}
	});

	// we need a block to test exception throwing
	var createView = function () {
		return new svc.View({subject:subject});
	};

	var subject = new svc.Subject({});

	// try to create a raw view, which throws an error
	raises(createView, "View.js: draw must be defined in a subclass.", "Shouldn't be able to create a base view.");

	// now, test a 'real' view
	var testView = new TestView({subject: subject, varName: 'testView'});

	// test getters
	ok(testView.getElement().hasClass('test'), "view's element has the class name 'test'.");
	ok(testView.getSubject().isEqual(subject), "view's Subject is subject.");
	ok(testView.getElement().is(':visible'), "view's element is visible.");

	// by default, views subscribe to subject:destroy
	equal(testView._subscribedFunctions.keys().length, 1, "1 notification subscribed.");
	deepEqual(testView._subscribedFunctions.keys(), ['subject:destroy'], "Subscribed notifications is 'subject:destroy'.");

	// subscribe a couple functions
	testView.subscribe('test', testView.notified.bind(testView));
	testView.subscribe('foo', testView.fakeSubscription.bind(testView));

	// test that we have all the notifications
	equal(testView._subscribedFunctions.keys().length, 3, "3 notifications subscribed.");
	deepEqual(testView._subscribedFunctions.keys(), ['subject:destroy', 'test', 'foo'], "Subscribed notifications are 'subject:destroy', 'test', and 'foo'");

	// test notifications
	ok(!testView.getNotified(), "notification hasn't taken place yet.");

	subject.notify('test');

	ok(testView.getNotified(), "notification has taken place.");

	// test unsubscribe
	testView.unsubscribe('foo');
	equal(testView._subscribedFunctions.keys().length, 2, "2 notification subscribed.");
	deepEqual(testView._subscribedFunctions.keys(), ['subject:destroy', 'test'], "Subscribed notifications are 'subject:destroy' and 'test'.");

	testView.unsubscribeAll();
	equal(testView._subscribedFunctions.keys().length, 0, "No notifications subscribed.");

	// test tear down
	testView.tearDown();
	ok(!testView.getElement().visible(), "view's element is not visible.");

	// test tear down by notification
	var testViewDestroyViaNotification = new TestView({subject:subject, varName:'testViewDestroyViaNotification'});

	// by default, views subscribe to subject:destroy
	equal(testViewDestroyViaNotification._subscribedFunctions.keys().length, 1, "1 notification subscribed.");
	deepEqual(testViewDestroyViaNotification._subscribedFunctions.keys(), ['subject:destroy'], "Subscribed notifications is 'subject:destroy'.");

	// remotely teardown
	subject.notify('subject:destroy');

	// check that that works out
	equal(testViewDestroyViaNotification._subscribedFunctions.keys().length, 0, "No notifications subscribed.");

	// set up two views to make sure multiple views can subscribe to the same subject
	var testView1 = new TestView({subject:subject, varName:'testView1'});
	var testView2 = new TestView({subject:subject, varName:'testView2'});

	testView1.subscribe('test', testView1.notified.bind(testView1));
	testView2.subscribe('test', testView2.notified.bind(testView2));

	equal(testView1._subscribedFunctions.keys().length, 2, "2 notifications subscribed.");
	deepEqual(testView1._subscribedFunctions.keys(), ['subject:destroy', 'test'], "Subscribed notifications are 'subject:destroy' and 'test'.");
	equal(testView2._subscribedFunctions.keys().length, 2, "2 notifications subscribed.");
	deepEqual(testView2._subscribedFunctions.keys(), ['subject:destroy', 'test'], "Subscribed notifications are 'subject:destroy' and 'test'.");

	// test notifications
	ok(!testView1.getNotified(), "notification hasn't taken place yet for testView1.");
	ok(!testView2.getNotified(), "notification hasn't taken place yet for testView2.");

	subject.notify('test');

	ok(testView1.getNotified(), "notification has taken place for testView1.");
	ok(testView2.getNotified(), "notification has taken place for testView2.");

});

test('svc.Controller', function () {
	var controller = new svc.Controller({});

	ok(svc.Controller == controller.constructor, 'controller is an svc.Controller.');
});

