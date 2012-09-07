NODE_PREFIX=$(shell npm prefix)
NODE_MODULES=$(NODE_PREFIX)/node_modules

JS_MIN=$(NODE_MODULES)/.bin/uglifyjs
NODEUNIT=$(NODE_MODULES)/.bin/nodeunit

NAMESPACE=null
VERSION=$(shell cat version.txt)
VERSIONED_FILE=svc-$(VERSION).js

BASE_JS_FILES=\
		src/js/Subject.js\
		src/js/ModifiableSubject.js\
		src/js/Collection.js\
		src/js/View.js\
		src/js/ActionView.js\
		src/js/Controller.js\
#		src/js/AjaxController.js\
#		src/js/AjaxSingleRequestController.js\

JS_FILES=\
		src/js/intro.js\
		$(BASE_JS_FILES)\
		src/js/outro.js\


.PHONY: clean build

build: svc.min.js

clean:
	rm -rf svc.js svc-*.js svc.min.*

$(JS_MIN):
	npm install uglify-js

nodeunit:
	npm install nodeunit

prototype:
	npm install prototype

svc.js:
	cat $(JS_FILES) > $(VERSIONED_FILE)
	sed -i -e "s/@VERSION/$(VERSION)/" -e "s/@NAMESPACE/$(NAMESPACE)/" $(VERSIONED_FILE)
	cp $(VERSIONED_FILE) svc.js

svc.min.js: $(JS_MIN) svc.js
	$(JS_MIN) svc.js > svc.min.js

test: build nodeunit
	$(NODEUNIT) test/test_svc.js
