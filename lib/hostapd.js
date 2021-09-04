'use strict'

const joi = require('joi');
const {spawn} = require('child_process');
const uuid = require('uuid');
const fs = (process.env.TESTENV) ? require('memfs') : require('fs');
const path = require('path');
const systemctl = require('systemctl');

function Hostapd(options) {
    const schema = joi.object({
	iface: joi.string().min(1).default('wlan0'),
	driver: joi.string().min(1).default('nl80211'),
	ssid: joi.string().min(1).required(),
	wpaPassphrase: joi.string().min(1).required(),
	hwMode: joi.string().min(1).default('g'),
	channel: joi.number().default(11),
	wpa: joi.number().default(1),
	wpaKeyMgmt: joi.string().min(1).default('WPA-PSK'),
	wpaPairwise: joi.string().min(1).default('TKIP CCMP'),
	wpaPtkRekey: joi.number().default(600),
	pidFile: joi.string().min(1).default(`/tmp/${uuid.v4()}.pid`),
	configFilePath: joi.string().min(1).default(`/etc/hostapd/hostapd.conf`)
    });

    const validated = joi.attempt(options, schema);
    this.options = validated;
    let configLines = [
	`interface=${this.options.iface}`,
	`driver=${this.options.driver}`,
	`ssid=${this.options.ssid}`,
	`wpa_passphrase=${this.options.wpaPassphrase}`,
	`hw_mode=${this.options.hwMode}`,
	`channel=${this.options.channel}`,
	`wpa=${this.options.wpa}`,
	`wpa_key_mgmt=${this.options.wpaKeyMgmt}`,
	`wpa_pairwise=${this.options.wpaPairwise}`,
	`wpa_ptk_rekey=${this.options.wpaPtkRekey}`
    ];
    this.configFile = configLines.join('\n');

    // Accommodate /sbin in path
    this.path = process.env.PATH;
    if (this.path.indexOf('/sbin') < 0) {
        this.path = `${this.path}:/sbin`;
    }

    // Find dnsmasq binary
    this.binary = null;
    this.path.split(':').forEach(binPath => {
        if (fs.existsSync(path.join(binPath, 'hostapd'))) {
            this.binary = path.join(binPath, 'hostapd');
        }
    });
}

Hostapd.prototype.start = function() {
    const hostapdServer = this;
    return new Promise(function(resolve, reject) {
	if (!hostapdServer.binary) {
	    return reject(new Error(`hostapd binary not found in any of: ${hostapdServer.path}`));
	}
	// Write config file
	fs.writeFileSync(hostapdServer.options.configFilePath, hostapdServer.configFile, 'utf8');
	const hostapd = spawn(hostapdServer.binary, [
	    '-P', hostapdServer.options.pidFile, '-B', hostapdServer.options.configFilePath
	]);
	let result = {};

	hostapd.stdout.on('data', (data) => {
	    result.stdout = data.toString('utf8').trim();
	});

	hostapd.stderr.on('data', (data) => {
	    result.stderr = data.toString('utf8').trim();
	});

	hostapd.on('close', (code) => {
	    result.code = code;
	    if (fs.existsSync(hostapdServer.options.pidFile)) {
		hostapdServer.pid = fs.readFileSync(hostapdServer.options.pidFile, 'utf8').trim();
	    }
	    if (result.code !== 0) {
                let error = new Error(`hostapd failed to start`);
                error.result = result;
                return reject(error);
            } else {
                return resolve(result);
            }
	});
    });
}

Hostapd.prototype.clearConfig = function() {
	fs.unlinkSync(this.options.configFilePath);
}

Hostapd.prototype.stop = function(pid) {
    const hostapdServer = this;
    return new Promise(function(resolve) {
        const hostapdPid = hostapdServer.pid || pid;
        if (fs.existsSync(hostapdServer.options.pidFile)) {
            fs.unlinkSync(hostapdServer.options.pidFile);
        }
        if (hostapdPid) {
            const kill = spawn('kill', [hostapdPid]);
            kill.on('close', () => {
                return resolve(hostapdPid);
            });
        } else {
            return resolve();
        }
    });
}

Hostapd.prototype.restart = async function(force = true) {
	let oldConfig;
	if (fs.existsSync(this.options.configFilePath)) {
		oldConfig = fs.readFileSync(this.options.configFilePath, 'utf-8');
	}
	// Restart only if config has changed
	if (force || (oldConfig !== this.configFile)) {
		fs.writeFileSync(this.options.configFilePath, this.configFile, 'utf8');
		await systemctl.restart('hostapd.service');
	}
}

module.exports = Hostapd;
