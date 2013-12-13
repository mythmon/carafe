/* globals describe:false, it: false, chai:false */

var carafe = require('../src/carafe');
var expect = chai.expect;

describe('carafe', function() {
    describe('utils', function() {
        describe('get', function() {
            it('should return a function.', function() {
                expect(carafe.utils.get('foo')).to.be.a('function');
            });

            it('should get a variable by name.', function() {
                var foo = {'bar': 5};
                expect(carafe.utils.get('bar')(foo)).to.equal(5);
            });

            it('should return undefined for non-existant keys.', function() {
                var foo = {'bar': 5};
                expect(carafe.utils.get('baz')(foo)).equal(undefined);
            });

            it('should it caches', function() {
                var a = carafe.utils.get('foo');
                var b = carafe.utils.get('foo');
                expect(a).to.equal(b);
            });
        });

        describe('ident', function() {
            it('should work for simple values', function() {
                expect(carafe.utils.ident(5)).to.equal(5);
            });

            it('should work for objects', function() {
                var foo = {a: 1, b: 2};
                expect(carafe.utils.ident(foo)).to.equal(foo);
            });
        });

        describe('property', function() {
            it('should return a function.', function() {
                expect(carafe.utils.property()).to.be.a('function');
            });

            it('should create a getter/setter function.', function() {
                var foo = {
                    bar: carafe.utils.property()
                };
                expect(foo.bar()).to.equal(undefined);
                foo.bar(5);
                expect(foo.bar()).to.equal(5);
            });

            it('should be chainable.', function() {
                var foo = {
                    bar: carafe.utils.property(),
                    baz: carafe.utils.property(),
                };
                expect(foo.bar(1).baz(2)).to.equal(foo);
            });

            it('should call the passed callback with the set value.', function(done) {
                var foo = {
                    bar: carafe.utils.property(undefined, function(val) {
                        expect(val).to.equal(5);
                        done();
                    })
                };
                foo.bar(5);
            });

            it('should call the callback after the stack unwinds.', function(done) {
                var count = 0;
                var foo = {
                    bar: carafe.utils.property(undefined, function() {
                        count++;
                        expect(count).to.equal(1);
                        done();
                    }),
                };
                foo.bar(1);
                expect(count).to.equal(0);
            });
        });

        describe('compose', function() {
            it('should compose a function with itself.', function() {
                function a(n) {
                    return n + 1;
                }
                expect(carafe.utils.compose(a, a)(0)).to.equal(2);
            });

            it('should preserve the second argument.', function() {
                function a(d, i) {
                    return i;
                }
                expect(carafe.utils.compose(a)(0, 1)).to.equal(1);
            });

            it('should compose compositions.', function() {
                var obj = {a: {b: {c: 1}}};
                function a(d) { return d.a; }
                function b(d) { return d.b; }
                function c(d) { return d.c; }
                var d = carafe.utils.compose(a, b);
                var e = carafe.utils.compose(d, c);
                expect(e(obj)).to.equal(1);
            });
        });

        describe('add', function() {
            it('should add two function results.', function() {
                function a(n) {
                    return n;
                }
                function b(n) {
                    return n * 2;
                }
                // 3 + (3 * 2) = 9
                expect(carafe.utils.add(a, b)(3)).to.equal(9);
            });

            it('should add a function result to a value.', function() {
                function a(n) {
                    return n;
                }
                // 3 + 2 = 5
                expect(carafe.utils.add(a, 2)(3)).to.equal(5);
            });

            it('should add three things.', function() {
                function a(n) {
                    return n;
                }
                function b(n) {
                    return n * 2;
                }
                // 4 + (4 * 2) + 2 = 14
                expect(carafe.utils.add(a, b, 2)(4)).to.equal(14);
            });

            it('should preserves the second parameter.', function() {
                function a(d, i) {
                    return i;
                }
                expect(carafe.utils.add(a, 1)(0, 1)).to.equal(2);
            });
        });

        describe('multiply', function() {
            it('should add two function results.', function() {
                function a(n) {
                    return n;
                }
                function b(n) {
                    return n * 2;
                }
                // 3 * (3 * 2) = 18
                expect(carafe.utils.multiply(a, b)(3)).to.equal(18);
            });

            it('should with a function and a value', function() {
                function a(n) {
                    return n;
                }
                // 3 * 2 = 6
                expect(carafe.utils.multiply(a, 2)(3)).to.equal(6);
            });

            it('should three things', function() {
                function a(n) {
                    return n;
                }
                function b(n) {
                    return n * 2;
                }
                // 4 * (4 * 2) * 2 = 64
                expect(carafe.utils.multiply(a, b, 2)(4)).to.equal(64);
            });

            it('should preserves index', function() {
                function a(d, i) {
                    return i;
                }
                expect(carafe.utils.multiply(a, 1)(0, 1)).to.equal(1);
            });
        });

        describe('popThis', function() {
            it('should return the bound this', function() {
                var foo = {'bar': 'baz'};
                expect(carafe.utils.popThis.call(foo, 'a', 'b')).to.equal(foo);
            });
        });

        describe('format', function() {
            it('should work with a single argument that is a function', function() {
                function a(name) {
                    return name.toUpperCase();
                }
                expect(carafe.utils.format('Hello, {0}', a)('World')).to.equal('Hello, WORLD');
            });

            it('should work with a single argument that is a value', function() {
                expect(carafe.utils.format('Hello, {0}', 'World')()).to.equal('Hello, World');
            });

            it('should work with multiple mixed values', function() {
                function a(s) {
                    return s.toLowerCase();
                }
                function b(s) {
                    return s.toUpperCase();
                }
                var actual = carafe.utils.format('I like to eat {0}, {1}, and {2}', a, 'oranges', b)('Apples');
                var expected = 'I like to eat apples, oranges, and APPLES';
                expect(actual).to.equal(expected);
            });

            it('should work with dotted gets', function() {
                var d = {
                    username: 'bob',
                    count: 9001,
                };
                function a() {
                    return 'commits';
                }
                var actual = carafe.utils.format('{0.username} made {0.count} {1}', carafe.utils.ident, a)(d);
                var expected = 'bob made 9001 commits';
                expect(actual).to.equal(expected);
            });
        });

        describe('dottedGet', function() {
            it('should work with undotted selectors on values', function() {
                var foo = {bar: 5};
                expect(carafe.utils.dottedGet('bar')(foo)).to.equal(5);
            });

            it('should work with undotted selectors on functions', function() {
                function a() {
                    return 5;
                }
                expect(carafe.utils.dottedGet('foo')({foo: a})).to.equal(5);
            });

            it('should work with dotted selectors on values', function() {
                var foo = {bar: {baz: 5}};
                expect(carafe.utils.dottedGet('bar.baz')(foo)).to.equal(5);
            });

            it('should work with dotted selectors on functions', function() {
                function a() {
                    return {bar: 5};
                }
                expect(carafe.utils.dottedGet('foo.bar')({foo: a})).to.equal(5);
            });

            it('should return undefined if anything is undefined.', function() {
                expect(carafe.utils.dottedGet('foo.bar.baz')({foo: {}})).to.equal(undefined);
            });
        });
    });
});
