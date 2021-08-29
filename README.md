# hostapd-config
Nodejs wrapper to configure and run hostapd

## Usage
```
/*
 * The following creates a basic WPA WiFi network
 * on a raspberry pi 3B.
 */
const Hostapd = require('hostapd-config');

const options = {
  iface: 'wlan0',
  ssid: 'TellMyWiFiLoveHer',
  wpaPassphrase: 'supersecretpassword'
};

const hostapd = new Hostapd(options);

// Start independent daemon
hostapd.start().then(result => {
  console.log(`Hostapd started with code ${result.code}`);
}).catch(err => {
  console.log(`Hostapd failed to start: ${err.message}`);
});

// alternatively you can start it as a systemctl service
hostapd.restart().then(() => {
  console.log('Service started successfully');
});
```

## Options
|Option|Type|Description|default|required|
|------|----|-----------|-------|--------|
|iface|String|Network Interface hostapd listens on|wlan0|default|
|ssid|String|SSID (display name of your WiFi network)|N/A|yes|
|wpaPassphrase|String|Your WiFi password|N/A|yes|
|driver|String|WiFi driver to use|nl80211 (raspberry pi wifi)|default|
|hwMode|String|**hw_mode** option in hostapd|g|default|
|channel|Integer|**channel** option in hostapd|11|default|
|wpa|Integer|**wpa** option in hostapd|1|default|
|wpaKeyMgmt|String|**wpa_key_mgmt** option in hostapd|WPA-PSK|default|
|wpaPairwise|String|**wpa_pairwise** option in hostapd|TKIP CCMP|default|
|wpaPtkRekey|Integer|**wpa_ptk_rekey** option in hostapd|600|default|
|pidFile|String|Path to pid file|/tmp/{uuidv4}.conf|default|
|configFilePath|String|Path to hostapd config file|/etc/hostapd/hostapd.conf|default|

For more info on **bolded** options, see the hostapd man page.
