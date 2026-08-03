'use strict';
'require view';
'require form';
'require uci';
'require network';
'require rpc';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} }
});

const callInterfaceDump = rpc.declare({
	object: 'network.interface',
	method: 'dump',
	expect: { interface: [] }
});

const DNS4_CHOICES = [
	[ '1.1.1.1', 'Cloudflare 主 DNS（1.1.1.1）' ],
	[ '1.0.0.1', 'Cloudflare 备用 DNS（1.0.0.1）' ],
	[ '8.8.8.8', 'Google 主 DNS（8.8.8.8）' ],
	[ '8.8.4.4', 'Google 备用 DNS（8.8.4.4）' ],
	[ '223.5.5.5', '阿里主 DNS（223.5.5.5）' ],
	[ '223.6.6.6', '阿里备用 DNS（223.6.6.6）' ],
	[ '9.9.9.9', 'Quad9 主 DNS（9.9.9.9）' ],
	[ '149.112.112.112', 'Quad9 备用 DNS（149.112.112.112）' ]
];

const DNS6_CHOICES = [
	[ '2606:4700:4700::1111', 'Cloudflare 主 IPv6 DNS（2606:4700:4700::1111）' ],
	[ '2606:4700:4700::1001', 'Cloudflare 备用 IPv6 DNS（2606:4700:4700::1001）' ],
	[ '2001:4860:4860::8888', 'Google 主 IPv6 DNS（2001:4860:4860::8888）' ],
	[ '2001:4860:4860::8844', 'Google 备用 IPv6 DNS（2001:4860:4860::8844）' ],
	[ '2400:3200::1', '阿里主 IPv6 DNS（2400:3200::1）' ],
	[ '2400:3200:baba::1', '阿里备用 IPv6 DNS（2400:3200:baba::1）' ],
	[ '2620:fe::fe', 'Quad9 主 IPv6 DNS（2620:fe::fe）' ],
	[ '2620:fe::9', 'Quad9 备用 IPv6 DNS（2620:fe::9）' ]
];

function addDnsChoices(option, choices) {
	choices.forEach(function(choice) {
		option.value(choice[0], choice[1]);
	});
}

function asArray(value) {
	if (Array.isArray(value))
		return value;

	return value ? String(value).trim().split(/\s+/) : [];
}

function findSection(config, type, option, value) {
	let result = null;

	uci.sections(config, type, function(section) {
		if (!result && section[option] === value)
			result = section;
	});

	return result;
}

function findSectionTwo(config, type, option1, value1, option2, value2) {
	let result = null;

	uci.sections(config, type, function(section) {
		if (!result && section[option1] === value1 && section[option2] === value2)
			result = section;
	});

	return result;
}

function findEnabledForwarding(sourceZone, destinationZone) {
	let result = null;

	uci.sections('firewall', 'forwarding', function(section) {
		if (!result && section.enabled !== '0' && section.src === sourceZone &&
			section.dest === destinationZone)
			result = section;
	});

	return result;
}

function findSharedForwardingZone(firstNetwork, secondNetwork) {
	let result = null;

	uci.sections('firewall', 'zone', function(section) {
		const networks = asArray(section.network);
		if (!result && section.enabled !== '0' &&
			String(section.forward || '').toUpperCase() === 'ACCEPT' &&
			networks.includes(firstNetwork) && networks.includes(secondNetwork))
			result = section;
	});

	return result;
}

function firstSections(config, type, count) {
	const result = [];

	uci.sections(config, type, function(section) {
		if (result.length < count)
			result.push(section['.name']);
	});

	return result;
}

function eui64DestIp(mac, suffix) {
	const parts = String(mac || '').toLowerCase().split(':');
	if (parts.length !== 6 || parts.some(function(part) { return !/^[0-9a-f]{2}$/.test(part); }))
		return '';

	const firstByte = ('0' + (parseInt(parts[0], 16) ^ 0x02).toString(16)).slice(-2);
	return '::' + firstByte + parts[1] + ':' + parts[2] + 'ff:fe' + parts[3] + ':' +
		String(suffix || '').toLowerCase() + '/::ffff:ffff:ffff:ffff';
}

function wifiBandLabel(section) {
	const band = String(section.band || '').toLowerCase();
	const hwmode = String(section.hwmode || '').toLowerCase();

	if (band === '2g' || band === '2.4g' || /11[bg]/.test(hwmode))
		return '2.4G';
	if (band === '5g' || /11a/.test(hwmode))
		return '5G';
	if (band === '6g')
		return '6G';

	return '频段未知';
}

function findWifiByRadio(radio) {
	return findSection('wireless', 'wifi-iface', 'device', radio);
}

function lanPortNumber(name) {
	const match = /^lan(\d+)$/.exec(name || '');
	return match ? Number(match[1]) : -1;
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('mwan-switch'),
			uci.load('network'),
			uci.load('dhcp'),
			uci.load('firewall'),
			uci.load('wireless'),
			network.getDevices(),
			L.resolveDefault(callServiceList('mwan-switch-monitor'), {}),
			L.resolveDefault(callInterfaceDump(), [])
		]);
	},

	render: function(data) {
		let m, s, o;
		const networkDevices = data[5] || [];
		const wifiDevices = [];
		uci.sections('wireless', 'wifi-device', function(section) {
			wifiDevices.push(section);
		});
		const wifiDeviceDetails = wifiDevices.map(function(section) {
			return (section['.name'] || '未命名 Radio') + '（' + wifiBandLabel(section) + '）';
		});
		const wirelessCardLabel = wifiDeviceDetails.length ?
			wifiDeviceDetails.length + ' 个：' + wifiDeviceDetails.join('、') : '未检测到无线网卡';
		let firewallDefaults = null;
		uci.sections('firewall', 'defaults', function(section) {
			if (!firewallDefaults)
				firewallDefaults = section;
		});
		const firewallDefaultForwardAccept = !!firewallDefaults &&
			String(firewallDefaults.forward || '').toUpperCase() === 'ACCEPT';
		const lanDevices = networkDevices.filter(function(device) {
			return /^lan\d+$/.test(device.getName()) &&
				(typeof(device.getMAC) !== 'function' || device.getMAC() !== null || device.isUp());
		}).sort(function(a, b) {
			return lanPortNumber(a.getName()) - lanPortNumber(b.getName());
		});
		const vpnDeviceNames = networkDevices.filter(function(device) {
			return /^tun/.test(device.getName());
		}).map(function(device) {
			return device.getName();
		}).sort();
		const detectedPorts = lanDevices.map(function(device) { return device.getName(); });
		const lastDetectedPort = detectedPorts.length ? detectedPorts[detectedPorts.length - 1] : '';
		const desiredMode = uci.get('mwan-switch', 'main', 'mode') || 'dual';
		const desiredTarget = uci.get('mwan-switch', 'main', 'target_lan_uplink') ||
			uci.get('mwan-switch', 'main', 'lan4_uplink') || 'wan2';
		const desiredLanAccessTarget = uci.get('mwan-switch', 'main', 'lan_access_target') || '1';
		const desiredWifi24 = uci.get('mwan-switch', 'main', 'wifi24_uplink') || 'wan2';
		const desiredWifi5 = uci.get('mwan-switch', 'main', 'wifi5_uplink') || 'wan';
		const legacyVpnWan1Isolation = uci.get('mwan-switch', 'main', 'vpn_wan1_isolation') || '0';
		const legacyVpnWan2Isolation = uci.get('mwan-switch', 'main', 'vpn_wan2_isolation') || '1';
		const desiredVpnIsolation = uci.get('mwan-switch', 'main', 'vpn_isolation') ||
			(legacyVpnWan1Isolation === '1' ?
				(legacyVpnWan2Isolation === '1' ? 'both' : 'wan1') :
				(legacyVpnWan2Isolation === '1' ? 'wan2' : 'none'));
		const desiredVpnWan1Isolation =
			(desiredVpnIsolation === 'wan1' || desiredVpnIsolation === 'both') ? '1' : '0';
		const desiredVpnWan2Isolation =
			(desiredVpnIsolation === 'wan2' || desiredVpnIsolation === 'both') ? '1' : '0';
		const desiredWan2Proto = uci.get('mwan-switch', 'main', 'wan2_proto') || 'dhcp';
		const desiredWan2Ipv6 = uci.get('mwan-switch', 'main', 'wan2_ipv6') || '1';
		const desiredWan2LanIp = uci.get('mwan-switch', 'main', 'wan2_lan_ip') || '192.168.77.1';
		const desiredWan2Table = uci.get('mwan-switch', 'main', 'wan2_table') || '200';
		const desiredManageLuna = uci.get('mwan-switch', 'main', 'manage_luna') || '1';
		const desiredLunaMac = uci.get('mwan-switch', 'main', 'luna_mac') || '02:12:34:56:78:9A';
		const desiredLunaIpv4Suffix = uci.get('mwan-switch', 'main', 'luna_ipv4_suffix') || '186';
		const desiredLunaIpv4PortForward = uci.get('mwan-switch', 'main', 'luna_ipv4_port_forward') || '1';
		const desiredLunaIpv4Port = uci.get('mwan-switch', 'main', 'luna_ipv4_port') || '50000';
		const desiredLunaIpv6Firewall = uci.get('mwan-switch', 'main', 'luna_ipv6_firewall') || '1';
		const desiredLunaIpv6DestSuffix = uci.get('mwan-switch', 'main', 'luna_ipv6_dest_suffix') || '789a';
		const configuredLunaRoutes = asArray(uci.get('mwan-switch', 'main', 'luna_routes'));
		const desiredLunaRoutes = configuredLunaRoutes.length ? configuredLunaRoutes :
			[ '172.16.7.0/24', '192.168.8.0/24' ];
		const configuredLunaIpv6Ports = asArray(uci.get('mwan-switch', 'main', 'luna_ipv6_ports'));
		const desiredLunaIpv6Ports = configuredLunaIpv6Ports.length ? configuredLunaIpv6Ports :
			[ '50000', '50001' ];
		const wan2LinkMonitor = uci.get('mwan-switch', 'main', 'wan2_link_monitor') || '0';
		const wan2LinkRestore = uci.get('mwan-switch', 'main', 'wan2_link_restore') || '1';
		const monitorService = (data[6] || {})['mwan-switch-monitor'];
		const interfaceDump = Array.isArray(data[7]) ? data[7] :
			(Array.isArray((data[7] || {}).interface) ? data[7].interface : []);
		const wan2Runtime = interfaceDump.filter(function(status) {
			return status.interface === 'wan2';
		})[0] || {};
		const wan2Ipv6Runtime = interfaceDump.filter(function(status) {
			return status.interface === 'wan2_6';
		})[0] || {};
		const monitorInstances = monitorService && monitorService.instances ? monitorService.instances : {};
		const monitorServiceRunning = Object.keys(monitorInstances).some(function(name) {
			return monitorInstances[name] && monitorInstances[name].running === true;
		});
		const failoverActive = uci.get('mwan-switch', 'main', 'wan2_failover_active') === '1' &&
			desiredMode === 'dual' && wan2LinkMonitor === '1';
		const wan2Port = uci.get('mwan-switch', 'main', 'wan2_port') || 'lan1';
		const legacyTargetPort = uci.get('mwan-switch', 'main', 'lan4_port') || '';
		const targetPortSetting = uci.get('mwan-switch', 'main', 'target_lan_port') ||
			(legacyTargetPort && legacyTargetPort !== 'lan4' ? legacyTargetPort : 'auto');
		const targetPort = targetPortSetting === 'auto' ?
			(lastDetectedPort || legacyTargetPort) : targetPortSetting;
		const wifi24Radio = uci.get('mwan-switch', 'main', 'wifi24_radio') || 'radio0';
		const wifi5Radio = uci.get('mwan-switch', 'main', 'wifi5_radio') || 'radio1';
		const brLan = findSection('network', 'device', 'name', 'br-lan');
		const brWan2 = findSection('network', 'device', 'name', 'br-lan-wan2');
		const wifi24 = findWifiByRadio(wifi24Radio);
		const wifi5 = findWifiByRadio(wifi5Radio);
		const vpnWan1Block = findSection('firewall', 'rule', 'name', 'Block-OpenVPN-to-WAN1');
		const vpnWan1Forward = findSectionTwo('firewall', 'forwarding', 'src', 'vpn', 'dest', 'wan');
		const vpnWan2Block = findSection('firewall', 'rule', 'name', 'Block-OpenVPN-to-WAN2');
		const vpnWan2Forward = findSectionTwo('firewall', 'forwarding', 'src', 'vpn', 'dest', 'wan2');
		const targetLanForward = findSectionTwo('firewall', 'forwarding', 'src', 'lan_wan2', 'dest', 'lan');
		const targetWanForward = findSectionTwo('firewall', 'forwarding', 'src', 'lan_wan2', 'dest', 'wan');
		const mainLanTargetForward = findEnabledForwarding('lan', 'lan_wan2');
		const wanTargetForward = findEnabledForwarding('wan', 'lan_wan2');
		const wanTargetSharedZone = findSharedForwardingZone('wan', 'lan_wan2');
		const legacyLanTargetBlockRule = findSection('firewall', 'rule', 'name',
			'Block-MainLAN-to-WAN2-Clients');
		const wanTargetBlockRule = findSection('firewall', 'rule', 'name',
			'Block-WAN1-Upstream-to-LastLAN');
		const wanTargetBlockActive = !!wanTargetBlockRule &&
			wanTargetBlockRule.enabled !== '0' && wanTargetBlockRule.src === 'wan' &&
			wanTargetBlockRule.dest === 'lan_wan2' && wanTargetBlockRule.target === 'REJECT';
		const wan1UpstreamCanAccessTarget = (!!wanTargetForward || !!wanTargetSharedZone ||
			firewallDefaultForwardAccept) && !wanTargetBlockActive;
		const lunaHost = uci.get('dhcp', 'mwan_luna_v4', '.type');
		const lunaRedirect = uci.get('firewall', 'mwan_luna_ipv4_redirect', '.type');
		let legacyLunaRedirect = false;
		uci.sections('firewall', 'redirect', function(section) {
			if (/^mwan_luna_\d+$/.test(section['.name'] || ''))
				legacyLunaRedirect = true;
		});
		const lunaIpv6FirewallRule = uci.get('firewall', 'mwan_luna_ipv6_access', '.type');
		const firstFirewallRules = firstSections('firewall', 'rule', 2);
		const accessRuleOrderConsistent = !wanTargetBlockActive ||
			(desiredLunaIpv6Firewall === '1' ?
				firstFirewallRules[0] === 'mwan_luna_ipv6_access' &&
				firstFirewallRules[1] === 'mwan_block_wan_to_lan_wan2' :
				firstFirewallRules[0] === 'mwan_block_wan_to_lan_wan2');
		const lunaWan1Rule = uci.get('firewall', 'allow_wan1_to_lan4_device', '.type');
		const lunaManagedRoutes = [];
		uci.sections('network', 'route', function(section) {
			const name = section['.name'] || '';
			if (/^mwan_luna_route_\d+$/.test(name))
				lunaManagedRoutes.push(section);
		});
		lunaManagedRoutes.sort(function(a, b) {
			return parseInt(a['.name'].replace('mwan_luna_route_', ''), 10) -
				parseInt(b['.name'].replace('mwan_luna_route_', ''), 10);
		});
		const brLanPorts = asArray(brLan ? brLan.ports : null);
		const brWan2Ports = asArray(brWan2 ? brWan2.ports : null);
		const wifi24Networks = asArray(wifi24 ? wifi24.network : null);
		const wifi5Networks = asArray(wifi5 ? wifi5.network : null);
		const actualWan2Proto = uci.get('network', 'wan2', 'proto') || '';
		const wan2Ready = actualWan2Proto === desiredWan2Proto &&
			(actualWan2Proto === 'dhcp' || actualWan2Proto === 'pppoe') &&
			uci.get('network', 'wan2', 'device') === wan2Port &&
			!brLanPorts.includes(wan2Port);
		const actualMode = wan2Ready ? 'dual' : 'wan_only';
		const wan2Device = lanDevices.filter(function(device) {
			return device.getName() === wan2Port;
		})[0];
		const wan2Carrier = wan2Device ?
			(typeof(wan2Device.getCarrier) === 'function' ? wan2Device.getCarrier() : wan2Device.isUp()) : null;
		const actualTarget = brWan2Ports.includes(targetPort) ? 'wan2' :
			(brLanPorts.includes(targetPort) ? 'wan' : 'unknown');
		const actualWifi24 = wifi24Networks.includes('lan_wan2') ? 'wan2' :
			(wifi24Networks.includes('lan') ? 'wan' : 'unknown');
		const actualWifi5 = !wifi5 ? 'absent' :
			(wifi5Networks.includes('lan_wan2') ? 'wan2' :
				(wifi5Networks.includes('lan') ? 'wan' : 'unknown'));
		const actualVpnWan1Isolation = vpnWan1Block && vpnWan1Block.target === 'REJECT' && !vpnWan1Forward ? '1' :
			(!vpnWan1Block && vpnWan1Forward ? '0' : 'unknown');
		const actualVpnWan2Isolation = vpnWan2Block && vpnWan2Block.target === 'REJECT' && !vpnWan2Forward ? '1' :
			(!vpnWan2Block && vpnWan2Forward ? '0' : 'unknown');
		const effectiveDesiredMode = failoverActive ? 'wan_only' : desiredMode;
		const effectiveDesiredTarget = effectiveDesiredMode === 'dual' ? desiredTarget : 'wan';
		const effectiveDesiredWifi24 = effectiveDesiredMode === 'dual' ? desiredWifi24 : 'wan';
		const effectiveDesiredWifi5 = effectiveDesiredMode === 'dual' ? desiredWifi5 : 'wan';
		const actualWan1TargetAccess = wanTargetBlockActive &&
			(wanTargetForward || wanTargetSharedZone || !accessRuleOrderConsistent) ? 'unknown' :
			(wanTargetBlockActive ? '0' : (wan1UpstreamCanAccessTarget ? '1' : '0'));
		const wan1AccessPolicyConsistent = effectiveDesiredMode === 'dual' ?
			(desiredLanAccessTarget === '1' ?
				!!wanTargetForward && !wanTargetBlockActive && !wanTargetSharedZone :
				!wanTargetForward && wanTargetBlockActive && !wanTargetSharedZone &&
				accessRuleOrderConsistent) &&
			!!mainLanTargetForward && !legacyLanTargetBlockRule &&
			!targetLanForward && !targetWanForward :
			!mainLanTargetForward && !wanTargetForward && !legacyLanTargetBlockRule &&
			!wanTargetBlockRule && !targetLanForward && !targetWanForward;
		const internalIpv4PolicyConsistent =
			uci.get('network', 'lan_wan2_internal_ipv4', '.type') === 'rule' &&
			uci.get('network', 'lan_wan2_internal_ipv4', 'in') === 'lan_wan2' &&
			uci.get('network', 'lan_wan2_internal_ipv4', 'lookup') === 'main' &&
			uci.get('network', 'lan_wan2_internal_ipv4', 'suppress_prefixlength') === '0' &&
			uci.get('network', 'lan_wan2_internal_ipv4', 'priority') === '10500' &&
			uci.get('network', 'lan_wan2_ipv4', '.type') === 'rule' &&
			uci.get('network', 'lan_wan2_ipv4', 'in') === 'lan_wan2' &&
			uci.get('network', 'lan_wan2_ipv4', 'lookup') === desiredWan2Table &&
			uci.get('network', 'lan_wan2_ipv4', 'priority') === '11000' &&
			uci.get('network', 'wan2', 'ip4table') === desiredWan2Table;
		const internalIpv6PolicyConsistent = desiredWan2Ipv6 !== '1' ?
			!uci.get('network', 'lan_wan2_internal_ipv6') && !uci.get('network', 'lan_wan2_ipv6') :
			uci.get('network', 'lan_wan2_internal_ipv6', '.type') === 'rule6' &&
				uci.get('network', 'lan_wan2_internal_ipv6', 'in') === 'lan_wan2' &&
				uci.get('network', 'lan_wan2_internal_ipv6', 'lookup') === 'main' &&
				uci.get('network', 'lan_wan2_internal_ipv6', 'suppress_prefixlength') === '0' &&
				uci.get('network', 'lan_wan2_internal_ipv6', 'priority') === '10500' &&
				uci.get('network', 'lan_wan2_ipv6', '.type') === 'rule6' &&
				uci.get('network', 'lan_wan2_ipv6', 'in') === 'lan_wan2' &&
				uci.get('network', 'lan_wan2_ipv6', 'lookup') === desiredWan2Table &&
				uci.get('network', 'lan_wan2_ipv6', 'priority') === '11000' &&
				(desiredWan2Proto === 'pppoe' ?
					uci.get('network', 'wan2', 'ip6table') === desiredWan2Table :
					uci.get('network', 'wan2_6', 'ip6table') === desiredWan2Table);
		const noLanWan2Policy = !uci.get('network', 'lan_wan2_internal_ipv4') &&
			!uci.get('network', 'lan_wan2_ipv4') &&
			!uci.get('network', 'lan_wan2_return_ipv6') &&
			!uci.get('network', 'lan_wan2_internal_ipv6') &&
			!uci.get('network', 'lan_wan2_ipv6');
		const lanWan2PolicyConsistent = effectiveDesiredMode === 'dual' ?
			internalIpv4PolicyConsistent && internalIpv6PolicyConsistent : noLanWan2Policy;
		const returnPathNeeded = effectiveDesiredMode === 'dual' &&
			effectiveDesiredTarget === 'wan2' && desiredWan2Ipv6 === '1' &&
			desiredLunaIpv6Firewall === '1';
		const returnPathPolicyConsistent = returnPathNeeded ?
			uci.get('network', 'lan_wan2_return_ipv6', '.type') === 'rule6' &&
				!uci.get('network', 'lan_wan2_return_ipv6', 'disabled') &&
				uci.get('network', 'lan_wan2_return_ipv6', 'mark') === '0x20000/0x20000' &&
				uci.get('network', 'lan_wan2_return_ipv6', 'lookup') === desiredWan2Table &&
				uci.get('network', 'lan_wan2_return_ipv6', 'priority') === '10400' :
			!uci.get('network', 'lan_wan2_return_ipv6');
		const returnPathIncludeConsistent =
			uci.get('firewall', 'mwan_switch_return_path', '.type') === 'include' &&
			uci.get('firewall', 'mwan_switch_return_path', 'enabled') !== '0' &&
			uci.get('firewall', 'mwan_switch_return_path', 'type') === 'script' &&
			uci.get('firewall', 'mwan_switch_return_path', 'path') ===
				'/usr/libexec/mwan-switch-return-path' &&
			!uci.get('firewall', 'mwan_switch_return_path', 'family') &&
			!uci.get('firewall', 'mwan_switch_return_path', 'position') &&
			!uci.get('firewall', 'mwan_switch_return_path', 'chain') &&
			(uci.get('firewall', 'mwan_switch_return_path', 'reload') === '1' ||
				!uci.get('firewall', 'mwan_switch_return_path', 'reload')) &&
			uci.get('firewall', 'mwan_switch_return_path', 'fw4_compatible') === '1';
		const mainLanIp = uci.get('network', 'lan', 'ipaddr') || '192.168.7.1';
		const expectedLunaNetwork = effectiveDesiredMode === 'dual' &&
			effectiveDesiredTarget === 'wan2' ? 'lan_wan2' : 'lan';
		const expectedLunaPrefix = (expectedLunaNetwork === 'lan_wan2' ? desiredWan2LanIp : mainLanIp)
			.split('.').slice(0, 3).join('.');
		const expectedLunaIp = expectedLunaPrefix + '.' + desiredLunaIpv4Suffix;
		const expectedLunaSource = expectedLunaNetwork === 'lan_wan2' ? 'wan2' : 'wan';
		const expectedLunaDest = expectedLunaNetwork;
		const expectedLunaIpv6DestIp = eui64DestIp(desiredLunaMac, desiredLunaIpv6DestSuffix);
		const lunaRoutesConsistent = lunaManagedRoutes.length === desiredLunaRoutes.length &&
			desiredLunaRoutes.every(function(target, index) {
				const route = lunaManagedRoutes[index];
				return route && route['.name'] === 'mwan_luna_route_' + (index + 1) &&
					route.target === target && route.gateway === expectedLunaIp &&
					route.interface === expectedLunaNetwork;
			});
		const fixedDeviceIpv6Absent = !uci.get('dhcp', 'mwan_luna_v6') &&
			!uci.get('firewall', 'mwan_luna_ipv6');
		const fixedDeviceLegacyAbsent = !uci.get('dhcp', 'mwan_luna');
		const lunaIpv4RedirectConsistent = desiredManageLuna === '1' &&
			desiredLunaIpv4PortForward === '1' ?
			lunaRedirect === 'redirect' && !legacyLunaRedirect &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'name') ===
					'Managed-Device-IPv4-Port-Forward' &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'target') === 'DNAT' &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'src') === expectedLunaSource &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'dest') === expectedLunaDest &&
				asArray(uci.get('firewall', 'mwan_luna_ipv4_redirect', 'proto')).join(' ') === 'tcp udp' &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'src_dport') === desiredLunaIpv4Port &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'dest_port') === desiredLunaIpv4Port &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'dest_ip') === expectedLunaIp &&
				uci.get('firewall', 'mwan_luna_ipv4_redirect', 'family') === 'ipv4' :
			!lunaRedirect && !legacyLunaRedirect;
		const lunaIpv4Consistent = desiredManageLuna === '1' ?
			lunaHost === 'host' &&
				asArray(uci.get('dhcp', 'mwan_luna_v4', 'mac')).join(' ') === desiredLunaMac &&
				uci.get('dhcp', 'mwan_luna_v4', 'ip') === expectedLunaIp &&
				!uci.get('dhcp', 'mwan_luna_v4', 'duid') &&
				!uci.get('dhcp', 'mwan_luna_v4', 'hostid') &&
				lunaIpv4RedirectConsistent && lunaRoutesConsistent && !lunaWan1Rule && fixedDeviceIpv6Absent &&
				fixedDeviceLegacyAbsent :
			!lunaHost && !lunaRedirect && !legacyLunaRedirect && !lunaWan1Rule &&
				lunaManagedRoutes.length === 0 && fixedDeviceIpv6Absent && fixedDeviceLegacyAbsent;
		const lunaIpv6FirewallConsistent = desiredLunaIpv6Firewall === '1' ?
			lunaIpv6FirewallRule === 'rule' &&
				uci.get('firewall', 'mwan_luna_ipv6_access', 'enabled') !== '0' &&
				uci.get('firewall', 'mwan_luna_ipv6_access', 'name') === 'Allow-Managed-Device-IPv6' &&
				uci.get('firewall', 'mwan_luna_ipv6_access', 'src') === expectedLunaSource &&
				uci.get('firewall', 'mwan_luna_ipv6_access', 'dest') === expectedLunaDest &&
				uci.get('firewall', 'mwan_luna_ipv6_access', 'family') === 'ipv6' &&
				asArray(uci.get('firewall', 'mwan_luna_ipv6_access', 'proto')).join(' ') === 'tcp udp' &&
				asArray(uci.get('firewall', 'mwan_luna_ipv6_access', 'dest_port')).join(' ') ===
					desiredLunaIpv6Ports.join(' ') &&
				uci.get('firewall', 'mwan_luna_ipv6_access', 'target') === 'ACCEPT' &&
				asArray(uci.get('firewall', 'mwan_luna_ipv6_access', 'dest_ip')).join(' ') ===
					expectedLunaIpv6DestIp && accessRuleOrderConsistent : !lunaIpv6FirewallRule;
		const consistent = actualMode === effectiveDesiredMode &&
			actualTarget === effectiveDesiredTarget &&
			wan1AccessPolicyConsistent &&
			lanWan2PolicyConsistent &&
			returnPathPolicyConsistent &&
			returnPathIncludeConsistent &&
			lunaIpv4Consistent &&
			lunaIpv6FirewallConsistent &&
			actualWifi24 === effectiveDesiredWifi24 &&
			(actualWifi5 === 'absent' || actualWifi5 === effectiveDesiredWifi5) &&
			actualVpnWan1Isolation === desiredVpnWan1Isolation &&
			(effectiveDesiredMode !== 'dual' || actualVpnWan2Isolation === desiredVpnWan2Isolation) &&
			(desiredMode === 'dual' && wan2LinkMonitor === '1' ? monitorServiceRunning : !monitorServiceRunning);
		const label = function(value) {
			return value === 'dual' ? '双 WAN（' + wan2Port + ' 为 WAN2）' :
				(value === 'wan_only' ? '仅 WAN1' :
					(value === 'wan2' ? 'WAN2' :
						(value === 'wan' ? 'WAN1' : (value === 'absent' ? '未检测到' : '未知'))));
		};
		const vpnLabel = function(value) {
			return value === '1' ? '已隔离' : (value === '0' ? '允许访问' : '未知');
		};
		const wan1TargetAccessLabel = effectiveDesiredMode !== 'dual' ? '不适用（仅 WAN1）' :
			(actualWan1TargetAccess === 'unknown' ?
				'状态异常（存在放行路径或 REJECT 顺序无效）' :
				(actualWan1TargetAccess === '1' ?
					(wanTargetForward ? '允许（wan → lan_wan2 区域转发）' :
						(wanTargetSharedZone ? '允许（同属 ' +
							(wanTargetSharedZone.name || wanTargetSharedZone['.name']) +
							' 区域，存在双向访问风险）' :
							'允许（防火墙全局转发策略为 ACCEPT）')) :
					(wanTargetBlockActive ? '不允许（显式 REJECT；已配置的 IPv6 端口仍可例外放行）' :
						'不允许（未检测到有效放行路径）')));
		const lunaIpv4Label = desiredManageLuna === '1' ?
			(lunaIpv4Consistent ? '已管理（' + expectedLunaIp + '）' : '配置不一致') :
			(lunaIpv4Consistent ? '未管理' : '存在残留规则');
		const lunaIpv4PortLabel = desiredManageLuna !== '1' || desiredLunaIpv4PortForward !== '1' ?
			(lunaIpv4RedirectConsistent ? '已关闭' : '存在残留映射') :
			(lunaIpv4RedirectConsistent ? desiredLunaIpv4Port + ' 已映射' : '配置不一致');
		const lunaIpv6FirewallLabel = desiredLunaIpv6Firewall === '1' ?
			(lunaIpv6FirewallConsistent ?
				'已放行 ::' + desiredLunaIpv6DestSuffix + ' 的 ' + desiredLunaIpv6Ports.join('、') :
				'配置不一致') : (lunaIpv6FirewallConsistent ? '已关闭' : '存在残留规则');
		const vpnExitLabel = actualVpnWan1Isolation === 'unknown' ||
			(effectiveDesiredMode === 'dual' && actualVpnWan2Isolation === 'unknown') ?
			'防火墙出口规则异常' :
			(actualVpnWan1Isolation === '0' ?
				(effectiveDesiredMode === 'dual' && actualVpnWan2Isolation === '0' ?
					'允许 WAN1、WAN2（实际出口由系统路由/PBR 决定）' : '仅允许 WAN1') :
				(effectiveDesiredMode === 'dual' && actualVpnWan2Isolation === '0' ?
					'仅允许 WAN2' : 'WAN1、WAN2 均被阻止'));
		const vpnRuntimeLabel = (vpnDeviceNames.length ?
			'检测到 ' + vpnDeviceNames.join('、') : '未检测到 tun 接口') + '；' + vpnExitLabel;
		const lanWan2PolicyLabel = effectiveDesiredMode === 'dual' ?
			(lanWan2PolicyConsistent ? '内网优先，WAN2 后备' : '规则不一致') :
			(lanWan2PolicyConsistent ? '仅主 LAN' : '存在残留规则');
		const returnPathLabel = returnPathNeeded ?
			(returnPathPolicyConsistent && returnPathIncludeConsistent ?
				'已配置连接标记（0x20000）' : '配置不一致') :
			(returnPathPolicyConsistent && returnPathIncludeConsistent ? '不适用' : '存在残留或缺失配置');
		const targetLabel = targetPort || '未检测到';
		const wan2LinkLabel = wan2Carrier === true ? '已连接' :
			(wan2Carrier === false ? '未连接' : '无法检测');
		const wan2ProtoLabel = actualWan2Proto === 'pppoe' ? 'PPPoE' :
			(actualWan2Proto === 'dhcp' ? 'DHCP' : '未配置');
		const wan2Ipv4Addresses = Array.isArray(wan2Runtime['ipv4-address']) ?
			wan2Runtime['ipv4-address'] : [];
		const wan2Ipv4 = wan2Ipv4Addresses.length ? wan2Ipv4Addresses[0].address : '';
		const wan2Online = wan2Runtime.up === true || !!wan2Ipv4;
		const wan2Ipv6Addresses = Array.isArray(wan2Ipv6Runtime['ipv6-address']) ?
			wan2Ipv6Runtime['ipv6-address'] : [];
		const wan2Ipv6Prefixes = Array.isArray(wan2Ipv6Runtime['ipv6-prefix']) ?
			wan2Ipv6Runtime['ipv6-prefix'] : [];
		const wan2SessionLabel = failoverActive ? '故障转移中' :
			(wan2Carrier === false ? '物理链路断开' :
				(wan2Online ?
					(actualWan2Proto === 'pppoe' ? '拨号已连接' : '接口已联网') +
					(wan2Ipv4 ? '（' + wan2Ipv4 + '）' : '') :
					(wan2Runtime.pending === true ? '正在连接' :
						(actualWan2Proto === 'pppoe' ? '拨号未连接' : '接口未联网'))));
		const wan2Ipv6Label = desiredWan2Ipv6 !== '1' ? '已关闭' :
			(wan2Ipv6Runtime.up === true ?
				(wan2Ipv6Prefixes.length ? '已获得 IPv6-PD' :
					(wan2Ipv6Addresses.length ? '已获得 IPv6 地址，未获得 PD' : '客户端已启动，等待地址/PD')) :
				'客户端未启动');
		const monitorLabel = wan2LinkMonitor !== '1' ? '拔出检测关闭' :
			(!monitorServiceRunning ? '持续检测服务未运行' :
			(failoverActive ?
				(wan2LinkRestore === '1' ? '故障转移中，插入后自动恢复' : '故障转移中，插入后保持仅 WAN1') :
				('持续检测服务运行中；插入恢复' + (wan2LinkRestore === '1' ? '开启' : '关闭'))));
		const statusText = '当前状态：' + label(actualMode) +
			(desiredMode === 'dual' ? '；WAN2：' + wan2ProtoLabel + '，' + wan2SessionLabel +
				'；IPv6：' + wan2Ipv6Label +
				'；物理链路：' + wan2LinkLabel + '（自动检测：' + monitorLabel + '）' : '') +
			'；最后 LAN 口（' + targetLabel + '）→ ' + label(actualTarget) +
			'；WAN1 上游 → 最后 LAN 口：' + wan1TargetAccessLabel +
			'；最后端口回程：' + lanWan2PolicyLabel +
			'；WAN2 IPv6 入站回程：' + returnPathLabel +
			'；固定设备 IPv4：' + lunaIpv4Label +
			'；IPv4 映射：' + lunaIpv4PortLabel +
			'；IPv6 放行：' + lunaIpv6FirewallLabel +
			'；无线网卡：' + wirelessCardLabel +
			'；2.4G → ' + label(actualWifi24) +
			'；5G → ' + label(actualWifi5) +
			'；VPN 当前出口：' + vpnRuntimeLabel +
			'；VPN/WAN1：' + vpnLabel(actualVpnWan1Isolation) +
			(effectiveDesiredMode === 'dual' ? '；VPN/WAN2：' + vpnLabel(actualVpnWan2Isolation) : '') +
			'；与页面配置' + (consistent ? '一致' : '不一致，保存并应用后将自动修正');

		m = new form.Map('mwan-switch', 'LAN端口切换',
			'页面只保存 UCI 选项，不直接执行命令。点击 LuCI 自带的“保存并应用”后，mwan-switch 服务会检测物理 LAN 口，并以 UCI 方式增量调整配置；端口或无线出口改变时会自动触发客户端重新获取 IPv4/IPv6。');

		s = m.section(form.NamedSection, 'main', 'settings', '切换设置');
		s.addremove = false;
		s.tab('basic', '基本设置');
		s.tab('wan2', 'WAN2 上网');
		s.tab('dns', 'DNS 设置');
		s.tab('device', '固定设备 IPv4');
		s.tab('firewall', '防火墙规则');
		s.tab('advanced', '高级设置');

		o = s.taboption('basic', form.DummyValue, '_current_status', '实际运行状态');
		o.cfgvalue = function() { return statusText; };

		o = s.taboption('basic', form.DummyValue, '_port_status', '物理网口状态');
		o.renderWidget = function() {
			const rows = [ E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th' }, '端口'),
				E('div', { 'class': 'th' }, '连接状态'),
				E('div', { 'class': 'th' }, '当前用途')
			]) ];

			lanDevices.forEach(function(device) {
				const name = device.getName();
				const speed = typeof(device.getSpeed) === 'function' ? device.getSpeed() : null;
				const carrier = typeof(device.getCarrier) === 'function' ? device.getCarrier() : device.isUp();
				let state = carrier ? '已连接' : '未连接';
				let purpose = brWan2Ports.includes(name) ? 'WAN2 内网' :
					(name === wan2Port && actualMode === 'dual' ? 'WAN2 上联' :
						(name === wan2Port && failoverActive ? 'WAN2 隔离探测' :
							(brLanPorts.includes(name) ? 'WAN1 内网' : '未分配')));

				if (carrier && speed && speed > 0)
					state += '（' + speed + ' Mbps）';
				if (name === targetPort)
					purpose += '；最后 LAN 口';

				rows.push(E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, name),
					E('div', { 'class': 'td' }, state),
					E('div', { 'class': 'td' }, purpose)
				]));
			});

			if (!lanDevices.length)
				rows.push(E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td' }, '未检测到名称为 lanN 的 DSA 网口')
				]));

			return E('div', {}, [
				E('p', {}, '检测到 ' + lanDevices.length + ' 个 LAN 网口；自动目标为 ' + targetLabel + '。'),
				E('div', { 'class': 'table' }, rows)
			]);
		};

		o = s.taboption('basic', form.DummyValue, '_wireless_card_status', '当前无线网卡数量');
		o.cfgvalue = function() { return wirelessCardLabel; };
		o.description = '按 /etc/config/wireless 中实际存在的 wifi-device（Radio）检测，并显示 Radio 名称和可识别的频段；可据此确认设备当前配置了 1 个还是 2 个无线网卡。';

		o = s.taboption('basic', form.ListValue, 'mode', 'WAN 工作模式');
		o.value('dual', '启用 WAN2：LAN1 改为 WAN2');
		o.value('wan_only', '仅使用 WAN1：所有 LAN 口和无线恢复为 WAN1');
		o.default = 'dual';
		o.rmempty = false;

		o = s.taboption('basic', form.Flag, 'wan2_link_monitor', 'WAN2 拔出后自动仅 WAN1');
		o.default = '0';
		o.rmempty = false;
		o.depends('mode', 'dual');
		o.description = '开启后，WAN2 拔出并持续超过确认时间会临时切换为仅 WAN1，同时保留此前配置。';

		o = s.taboption('basic', form.Flag, 'wan2_link_restore', 'WAN2 插入后恢复之前配置');
		o.default = '1';
		o.rmempty = false;
		o.depends({ mode: 'dual', wan2_link_monitor: '1' });
		o.description = '开启后，只有在自动故障状态中检测到 WAN2 重新插入，才恢复此前的端口、无线和 VPN 配置；关闭时继续保持仅 WAN1。';

		o = s.taboption('basic', form.Value, 'wan2_link_delay', 'WAN2 状态确认时间（秒）');
		o.datatype = 'range(4,300)';
		o.default = '10';
		o.rmempty = false;
		o.depends({ mode: 'dual', wan2_link_monitor: '1' });
		o.description = '拔出和重新插入都必须持续达到此时间才切换，避免网络重载或链路协商时误判。';

		o = s.taboption('basic', form.ListValue, 'target_lan_uplink', '最后一个 LAN 口上网出口');
		o.value('wan', 'WAN1');
		o.value('wan2', 'WAN2');
		o.default = 'wan2';
		o.rmempty = false;
		o.depends('mode', 'dual');
		o.cfgvalue = function() { return desiredTarget; };

		o = s.taboption('firewall', form.ListValue, 'lan_access_target', 'WAN1 上游访问最后 LAN 口设备');
		o.value('1', '允许');
		o.value('0', '不允许');
		o.default = '1';
		o.rmempty = false;
		o.depends('mode', 'dual');
		o.description = '控制 WAN1 上级路由所在网络能否主动访问最后 LAN 口及选择 WAN2 的无线客户端。主 LAN 到最后 LAN 口的单向访问始终保留。';

		o = s.taboption('firewall', form.DummyValue, '_lan_access_detection', '当前 WAN1 上游访问情况');
		o.cfgvalue = function() { return wan1TargetAccessLabel; };
		o.depends('mode', 'dual');
		o.description = '检查 wan → lan_wan2 转发、重复区域归属、全局 forward ACCEPT 和显式 REJECT。选择“不允许”不会取消下方单独配置的 IPv6 端口例外。';

		o = s.taboption('basic', form.ListValue, 'wifi24_uplink', '2.4G 无线上网出口');
		o.value('wan', 'WAN1');
		o.value('wan2', 'WAN2');
		o.default = 'wan2';
		o.rmempty = false;
		o.depends('mode', 'dual');

		o = s.taboption('basic', form.ListValue, 'wifi5_uplink', '5G 无线上网出口');
		o.value('wan', 'WAN1');
		o.value('wan2', 'WAN2');
		o.default = 'wan';
		o.rmempty = false;
		o.depends('mode', 'dual');

		o = s.taboption('wan2', form.ListValue, 'wan2_proto', 'WAN2 上网方式');
		o.value('dhcp', 'DHCP 自动获取');
		o.value('pppoe', 'PPPoE 拨号');
		o.default = 'dhcp';
		o.rmempty = false;
		o.depends('mode', 'dual');

		o = s.taboption('wan2', form.Value, 'wan2_pppoe_username', 'PPPoE 账号');
		o.rmempty = false;
		o.depends({ mode: 'dual', wan2_proto: 'pppoe' });

		o = s.taboption('wan2', form.Value, 'wan2_pppoe_password', 'PPPoE 密码');
		o.password = true;
		o.rmempty = false;
		o.depends({ mode: 'dual', wan2_proto: 'pppoe' });

		o = s.taboption('wan2', form.Flag, 'wan2_ipv6', '自动获取 IPv6');
		o.default = '1';
		o.rmempty = false;
		o.depends('mode', 'dual');
		o.description = 'DHCP 使用静态 wan2_6 → @wan2；PPPoE 由 netifd 在每次拨号成功后自动创建 wan2_6。';

		o = s.taboption('dns', form.ListValue, 'lan_dns_mode', '主 LAN DNS 设置');
		o.value('keep', '不修改现有 DNS');
		o.value('custom', '使用下面的自定义 DNS');
		o.default = 'custom';
		o.rmempty = false;
		o.description = '自定义模式会把下面的 DNS 地址下发给主 LAN 的有线和无线客户端。';

		o = s.taboption('dns', form.DynamicList, 'lan_dns4', '主 LAN IPv4 DNS');
		o.datatype = 'ip4addr';
		o.default = [ '1.1.1.1', '8.8.8.8', '223.5.5.5', '9.9.9.9' ];
		o.rmempty = false;
		o.placeholder = '请选择预置 DNS 或输入自定义 IPv4 地址';
		addDnsChoices(o, DNS4_CHOICES);
		o.depends('lan_dns_mode', 'custom');

		o = s.taboption('dns', form.DynamicList, 'lan_dns6', '主 LAN IPv6 DNS');
		o.datatype = 'ip6addr';
		o.default = [ '2606:4700:4700::1111', '2001:4860:4860::8888', '2400:3200::1', '2620:fe::fe' ];
		o.rmempty = false;
		o.placeholder = '请选择预置 DNS 或输入自定义 IPv6 地址';
		addDnsChoices(o, DNS6_CHOICES);
		o.depends('lan_dns_mode', 'custom');

		o = s.taboption('dns', form.ListValue, 'wan2_dns_mode', 'WAN2 DNS 设置');
		o.value('keep', '不修改现有 DNS');
		o.value('custom', '使用下面的自定义 DNS');
		o.default = 'keep';
		o.rmempty = false;
		o.depends('mode', 'dual');
		o.description = '选择“不修改”时，本应用不会写入或删除 WAN2 上联及 WAN2 客户端的 DNS 选项。';

		o = s.taboption('dns', form.DynamicList, 'wan2_dns4', 'WAN2 客户端 IPv4 DNS');
		o.datatype = 'ip4addr';
		o.default = [ '1.1.1.1', '8.8.8.8', '223.5.5.5', '9.9.9.9' ];
		o.rmempty = false;
		o.placeholder = '请选择预置 DNS 或输入自定义 IPv4 地址';
		addDnsChoices(o, DNS4_CHOICES);
		o.depends({ mode: 'dual', wan2_dns_mode: 'custom' });

		o = s.taboption('dns', form.DynamicList, 'wan2_dns6', 'WAN2 客户端 IPv6 DNS');
		o.datatype = 'ip6addr';
		o.default = [ '2606:4700:4700::1111', '2001:4860:4860::8888', '2400:3200::1', '2620:fe::fe' ];
		o.rmempty = false;
		o.placeholder = '请选择预置 DNS 或输入自定义 IPv6 地址';
		addDnsChoices(o, DNS6_CHOICES);
		o.depends({ mode: 'dual', wan2_dns_mode: 'custom', wan2_ipv6: '1' });

		o = s.taboption('device', form.Flag, 'manage_luna', '管理最后 LAN 口固定设备 IPv4');
		o.default = '1';
		o.rmempty = false;
		o.description = '使用 UCI 管理指定设备的 DHCPv4 固定地址和后方 IPv4 路由。IPv4 端口映射可在下方单独启用并自定义端口；IPv6 放行规则位于“防火墙规则”页面。';

		o = s.taboption('device', form.DummyValue, '_luna_ipv4_address', '应用后的固定 IPv4');
		o.cfgvalue = function() { return expectedLunaIp; };
		o.depends('manage_luna', '1');

		o = s.taboption('device', form.Value, 'luna_mac', '固定设备 MAC');
		o.datatype = 'macaddr';
		o.default = '02:12:34:56:78:9A';
		o.rmempty = false;
		o.depends('manage_luna', '1');

		o = s.taboption('device', form.Value, 'luna_ipv4_suffix', '固定 IPv4 末段');
		o.datatype = 'range(2,254)';
		o.default = '186';
		o.rmempty = false;
		o.depends('manage_luna', '1');

		o = s.taboption('device', form.DynamicList, 'luna_routes', '固定设备后方 IPv4 路由');
		o.datatype = 'cidr4';
		o.default = [ '172.16.7.0/24', '192.168.8.0/24' ];
		o.placeholder = '例如 172.16.7.0/24';
		o.depends('manage_luna', '1');

		o = s.taboption('device', form.Flag, 'luna_ipv4_port_forward', '启用 IPv4 端口映射');
		o.default = '1';
		o.rmempty = false;
		o.depends('manage_luna', '1');

		o = s.taboption('device', form.Value, 'luna_ipv4_port', 'IPv4 映射端口');
		o.datatype = 'port';
		o.default = '50000';
		o.rmempty = false;
		o.depends({ manage_luna: '1', luna_ipv4_port_forward: '1' });
		o.description = '外部端口和固定设备内部端口使用同一个值，同时允许 TCP 和 UDP。';

		o = s.taboption('device', form.DummyValue, '_luna_ipv4_redirect', 'IPv4 映射预览');
		o.cfgvalue = function() {
			return (expectedLunaSource === 'wan2' ? 'WAN2' : 'WAN1') +
				' ' + desiredLunaIpv4Port + ' → ' + expectedLunaIp + ':' + desiredLunaIpv4Port +
				'（TCP/UDP）';
		};
		o.depends({ manage_luna: '1', luna_ipv4_port_forward: '1' });

		o = s.taboption('firewall', form.Flag, 'luna_ipv6_firewall', '启用 IPv6 放行规则');
		o.default = '1';
		o.rmempty = false;
		o.description = '使用 firewall3/firewall4 共用 UCI 规则，从最后 LAN 口当前上联网的防火墙区域放行指定 IPv6 后缀和 TCP/UDP 端口。最后 LAN 口经 WAN2 时，公网 IPv6 流量从 wan2 进入。';

		o = s.taboption('firewall', form.Value, 'luna_ipv6_dest_suffix', '目标 IPv6 后缀');
		o.default = '789a';
		o.rmempty = false;
		o.validate = function(sectionId, value) {
			return /^[0-9A-Fa-f]{1,4}$/.test(value || '') || '请输入 1 到 4 位十六进制字符，例如 789a';
		};
		o.depends('luna_ipv6_firewall', '1');
		o.description = '根据固定设备 MAC 生成 EUI-64 接口标识，并用这里的值作为最后 16 位。默认生成 ::0012:34ff:fe56:789a/::ffff:ffff:ffff:ffff。';

		o = s.taboption('firewall', form.DynamicList, 'luna_ipv6_ports', '允许的 IPv6 端口');
		o.datatype = 'port';
		o.default = [ '50000', '50001' ];
		o.rmempty = false;
		o.placeholder = '例如 50000';
		o.depends('luna_ipv6_firewall', '1');

		o = s.taboption('firewall', form.DummyValue, '_luna_ipv6_rule_preview', 'IPv6 规则预览');
		o.cfgvalue = function() {
			return 'Allow-Managed-Device-IPv6：' + expectedLunaSource + ' → ' + expectedLunaDest + '；TCP/UDP ' +
				desiredLunaIpv6Ports.join('、') + '；目标 ' + expectedLunaIpv6DestIp;
		};
		o.depends('luna_ipv6_firewall', '1');

		o = s.taboption('advanced', form.Value, 'wan2_lan_ip', 'WAN2 内网网关');
		o.datatype = 'ip4addr';
		o.default = '192.168.77.1';
		o.rmempty = false;

		o = s.taboption('advanced', form.Value, 'wan2_table', 'WAN2 路由表编号');
		o.datatype = 'range(1,252)';
		o.default = '200';
		o.rmempty = false;

		o = s.taboption('advanced', form.ListValue, 'wan2_port', 'WAN2 物理端口');
		detectedPorts.forEach(function(port) { o.value(port, port); });
		if (!detectedPorts.includes(wan2Port))
			o.value(wan2Port, wan2Port + '（当前配置，未检测到）');
		o.default = 'lan1';
		o.rmempty = false;

		o = s.taboption('advanced', form.ListValue, 'target_lan_port', '目标 LAN 物理端口');
		o.value('auto', '自动选择最后一个 LAN 口' + (lastDetectedPort ? '（' + lastDetectedPort + '）' : ''));
		detectedPorts.forEach(function(port) { o.value(port, port); });
		if (targetPortSetting !== 'auto' && !detectedPorts.includes(targetPortSetting))
			o.value(targetPortSetting, targetPortSetting + '（当前配置，未检测到）');
		o.default = 'auto';
		o.rmempty = false;
		o.cfgvalue = function() { return targetPortSetting; };

		o = s.taboption('advanced', form.Value, 'wifi24_radio', '2.4G Radio 名称');
		o.default = 'radio0';
		o.rmempty = false;

		o = s.taboption('advanced', form.Value, 'wifi5_radio', '5G Radio 名称');
		o.default = 'radio1';
		o.rmempty = false;

		o = s.taboption('firewall', form.ListValue, 'vpn_isolation', 'VPN 出口隔离');
		o.value('none', '不隔离（允许使用 WAN1 和 WAN2）');
		o.value('wan1', '隔离 WAN1（VPN 仅允许使用 WAN2）');
		o.value('wan2', '隔离 WAN2（VPN 仅允许使用 WAN1）');
		o.value('both', '同时隔离 WAN1 和 WAN2');
		o.default = 'wan2';
		o.rmempty = false;
		o.cfgvalue = function(sectionId) {
			return uci.get('mwan-switch', sectionId, 'vpn_isolation') || desiredVpnIsolation;
		};
		o.description = '选择 VPN 不能访问的出口；默认隔离 WAN2，使 tun+ 等 VPN 接口只通过 WAN1 上网。';

		o = s.taboption('firewall', form.DummyValue, '_vpn_exit_status', '当前 VPN 出口检测');
		o.cfgvalue = function() { return vpnRuntimeLabel; };
		o.description = '根据当前 tun 接口和实际启用的 VPN 防火墙转发/隔离规则判断。两边都允许时，最终出口可能由系统默认路由、mwan3 或其他 PBR 插件决定。';

		return m.render();
	}
});
