/*global describe, before, it*/
'use strict';
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var clean = require('./');
var expect = require('chai').expect;

describe('gulp-clean plugin', function () {

  var cwd = process.cwd();

  before(function () {
    var exists = fs.existsSync('tmp');
    if (!exists) { fs.mkdirSync('tmp'); }
  });

  function createTree(callback) {
    fs.mkdir('tmp/tree/', function () {
      fs.mkdir('tmp/tree/leaf', function () {
        fs.mkdir('tmp/tree/leaf/node', function () {
          fs.writeFile('tmp/tree/leaf/node/leaf.js', 'console.log("leaf")', function () {
            fs.mkdir('tmp/tree/leftleaf', function () {
              fs.writeFile('tmp/tree/leftleaf/leaf1.js', 'console.log("leaf")', function () {
                callback();
              });
            });
          });
        });
      });
    });
  }

  it('removes file', function (done) {
    var stream = clean();
    var content = 'testing';
    fs.writeFile('tmp/test.js', content, function () {
      stream.on('end', function () {
        fs.exists('tmp/test.js', function (exists) {
          expect(exists).to.be.false;
          done();
        });
      });

      stream.write(new gutil.File({
        cwd: cwd,
        base: cwd + '/tmp/',
        path: cwd + '/tmp/test.js',
        contents: new Buffer(content)
      }));

      stream.end();
    });
  });

  it('removes directory', function (done) {
    fs.mkdir('tmp/test', function () {
      var stream = clean();

      stream.on('end', function () {
        fs.exists('tmp/test', function (exists) {
          expect(exists).to.be.false;
          done();
        });
      });

      stream.write(new gutil.File({
        cwd: cwd,
        base: cwd + '/tmp/',
        path: cwd + '/tmp/test/'
      }));

      stream.end();
    });
  });

  it('removes all from tree', function (done) {
    createTree(function () {
      var stream = clean();

      stream.on('end', function () {
        fs.exists('tmp/tree/leaf/node/leaf.js', function (exists) {
          expect(exists).to.be.false;
          fs.exists('tmp/tree', function (exists) {
            expect(exists).to.be.false;
            done();
          });
        });
      });

      stream.write(new gutil.File({
        cwd: cwd,
        base: cwd + '/tmp',
        path: cwd + '/tmp/tree/'
      }));

      stream.end();
    });
  });

  it('cannot remove current working directory', function (done) {
    var stream = clean();

    stream.on('end', function () {
      fs.exists('.', function (exists) {
        expect(exists).to.be.true;
        done();
      });
    });

    stream.write(new gutil.File({
      cwd: cwd,
      path: cwd
    }));

    stream.end();
  });

  it('cannot delete anything outside working directory', function (done) {
    var stream = clean();

    if (!fs.existsSync('../secrets')) { fs.mkdirSync('../secrets'); }

    stream.on('end', function () {
      fs.exists('../secrets', function (exists) {
        expect(exists).to.be.true;
        done();
      });
    });

    stream.write(new gutil.File({
      cwd: path.resolve(cwd + '..'),
      path: path.resolve(cwd + '/../secrets/')
    }));

    stream.end();
  });
});