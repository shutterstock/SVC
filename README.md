# SVC

SVC (Subject-View-Controller) is a framework that allows for highly-interactive, low-latency web applications. It implements the MVC pattern using the Observer Pattern for the model object. This allows incredibly loose coupling between the Model, View, and Controller which makes adding new features incredibly easy. By using event-based notifications, specific views can update the elements that they need to.

## Dependencies

SVC is built on the [Prototype](http://prototypejs.org) framework, and requires version 1.7.

For building, we need [Node](http://nodejs.org) and [npm](http://npmjs.org).  Running 'make' should get you going with any luck.

You can also run tests in QUnit.

## Getting Started

## Documentation

### Subject



#### Modifiable Subject

#### Collection

### View

#### Action View

### Controller

#### Ajax Controller

#### Ajax Single Request Controller



## Authors

This library was developed by Joel Zimmer and Aaron Cohen at [Shutterstock](http://shutterstock.com).

## License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
