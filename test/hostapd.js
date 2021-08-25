'use strict';
const mockSpawn = require('mock-spawn');
const mySpawn = mockSpawn();
require('child_process').spawn = mySpawn;
const Hostapd = require('../lib/hostapd');
const expect = require('chai').expect;
const assert = require('chai').assert;
const fs = require('fs');

const configFiles = {
    default: fs.readFileSync(`${__dirname}/data/configFileDefault`, 'utf8')
}

async function expectError(fn) {
    let error = null;
    try {
        await fn();
    } catch (err) {
        error = err;
    }
    assert(error !== null);
}

describe('/lib/hostapd', function() {
    describe('constructor', function() {
        it('valid - defaults', function(done) {
            let hostapd = new Hostapd({
                ssid: 'TellMyWiFiLoveHer',
                wpaPassphrase: 'supsersecretpassphrase'
            });
            expect(hostapd.configFile).eql(configFiles.default);
            expect(hostapd.options.pidFile).not.undefined;
            done();
        });

        it('invalid', function(done) {
            try {
                new Hostapd({});
                done(new Error('This should have failed'));
            } catch (err) {
                done();
            }
        });
    }); // end constructor

    describe('start', function() {
        it('success', function(done) {
            let code = 0;
            let stdout = 'hostapd started successfully';
            mySpawn.setDefault(mySpawn.simple(code, stdout));

            const hostapdServer = new Hostapd({
                iface: 'wlan0',
                ssid: 'TellMyWiFiLoveHer',
                wpaPassphrase: 'supersecretpassword'
            });
            // Set binary manually
            hostapdServer.binary = '/usr/sbin/hostapd';

            hostapdServer.start().then(result => {
                expect(result.stdout).eql(stdout);
                expect(result.code).eql(code);
                done();
            }).catch(err => {
                done(err);
            });
        });

        it('no binary', function(done) {
            let code = 0;
            let stdout = 'hostapd started successfully';
            mySpawn.setDefault(mySpawn.simple(code, stdout));

            const hostapdServer = new Hostapd({
                iface: 'wlan0',
                ssid: 'TellMyWiFiLoveHer',
                wpaPassphrase: 'supersecretpassword'
            });
            // No binary set
            hostapdServer.binary = null;

            hostapdServer.start().then(result => {
                expect(result.stdout).eql(stdout);
                expect(result.code).eql(code);
                done(new Error('this should have failed'));
            }).catch(err => {
                done();
            });
        });
    }); // end start

    describe('stop', function() {
        it('success - pid property', function(done) {
            let code = 0;
            mySpawn.setDefault(mySpawn.simple(code, null, null));

            const hostapdServer = new Hostapd({
                iface: 'wlan0',
                ssid: 'TellMyWiFiLoveHer',
                wpaPassphrase: 'supersecretpassword'
            });
            hostapdServer.pid = 1234;
            hostapdServer.stop().then(() => {
                done();
            });
        });

        it('success - pid property', function(done) {
            let code = 0;
            mySpawn.setDefault(mySpawn.simple(code, null, null));

            const hostapdServer = new Hostapd({
                iface: 'wlan0',
                ssid: 'TellMyWiFiLoveHer',
                wpaPassphrase: 'supersecretpassword'
            });
            hostapdServer.stop(1234).then(() => {
                done();
            });
        });

        it('noop - no pid', function(done) {
            let code = 0;
            mySpawn.setDefault(mySpawn.simple(code, null, null));

            const hostapdServer = new Hostapd({
                iface: 'wlan0',
                ssid: 'TellMyWiFiLoveHer',
                wpaPassphrase: 'supersecretpassword'
            });
            hostapdServer.stop().then(() => {
                done();
            });
        });
    }); // end stop
});