(function (namespace, version){

	if (typeof(namespace) === "undefined") {
		namespace = {};
	} else if (! (typeof(namespace) === "object" || typeof(namespace) === "function")) {
		throw "Failed to initialize SVC - invalid namespace";
	}

	var svc = namespace.svc = {};
	svc.VERSION = version;
