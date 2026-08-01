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
			L.resolveDefault(callServiceList('mwan-switch-monitor'), {})
		]);
	},

	render: function(data) {
		let m, s, o;
		const lanDevices = (data[5] || []).filter(function(device) {
			return /^lan\d+$/.test(device.getName()) &&
				(typeof(device.getMAC) !== 'function' || device.getMAC() !== null || device.isUp());
		}).sort(function(a, b) {
			return lanPortNumber(a.getName()) - lanPortNumber(b.getName());
		});
		const detectedPorts = lanDevices.map(function(device) { return device.getName(); });
		const lastDetectedPort = detectedPorts.length ? detectedPorts[detectedPorts.length - 1] : '';
		const desiredMode = uci.get('mwan-switch', 'main', 'mode') || 'dual';
		const desiredTarget = uci.get('mwan-switch', 'main', 'target_lan_uplink') ||
			uci.get('mwan-switch', 'main', 'lan4_uplink') || 'wan2';
		const desiredWifi24 = uci.get('mwan-switch', 'main', 'wifi24_uplink') || 'wan2';
		const desiredWifi5 = uci.get('mwan-switch', 'main', 'wifi5_uplink') || 'wan';
		const desiredVpnIsolation = uci.get('mwan-switch', 'main', 'vpn_wan2_isolation') || '1';
		const wan2LinkMonitor = uci.get('mwan-switch', 'main', 'wan2_link_monitor') || '0';
		const wan2LinkRestore = uci.get('mwan-switch', 'main', 'wan2_link_restore') || '1';
		const monitorService = (data[6] || {})['mwan-switch-monitor'];
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
		const vpnBlock = findSection('firewall', 'rule', 'name', 'Block-OpenVPN-to-WAN2');
		const vpnForward = findSectionTwo('firewall', 'forwarding', 'src', 'vpn', 'dest', 'wan2');
		const brLanPorts = asArray(brLan ? brLan.ports : null);
		const brWan2Ports = asArray(brWan2 ? brWan2.ports : null);
		const wifi24Networks = asArray(wifi24 ? wifi24.network : null);
		const wifi5Networks = asArray(wifi5 ? wifi5.network : null);
		const wan2Ready = uci.get('network', 'wan2', 'proto') === 'dhcp' &&
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
		const actualVpnIsolation = vpnBlock && vpnBlock.target === 'REJECT' && !vpnForward ? '1' :
			(!vpnBlock && vpnForward ? '0' : 'unknown');
		const effectiveDesiredMode = failoverActive ? 'wan_only' : desiredMode;
		const effectiveDesiredTarget = effectiveDesiredMode === 'dual' ? desiredTarget : 'wan';
		const effectiveDesiredWifi24 = effectiveDesiredMode === 'dual' ? desiredWifi24 : 'wan';
		const effectiveDesiredWifi5 = effectiveDesiredMode === 'dual' ? desiredWifi5 : 'wan';
		const consistent = actualMode === effectiveDesiredMode &&
			actualTarget === effectiveDesiredTarget &&
			actualWifi24 === effectiveDesiredWifi24 &&
			(actualWifi5 === 'absent' || actualWifi5 === effectiveDesiredWifi5) &&
			(effectiveDesiredMode !== 'dual' || actualVpnIsolation === desiredVpnIsolation) &&
			(desiredMode === 'dual' && wan2LinkMonitor === '1' ? monitorServiceRunning : !monitorServiceRunning);
		const label = function(value) {
			return value === 'dual' ? '双 WAN（' + wan2Port + ' 为 WAN2）' :
				(value === 'wan_only' ? '仅 WAN1' :
					(value === 'wan2' ? 'WAN2' :
						(value === 'wan' ? 'WAN1' : (value === 'absent' ? '未检测到' : '未知'))));
		};
		const vpnLabel = actualVpnIsolation === '1' ? '已隔离' :
			(actualVpnIsolation === '0' ? '允许访问' : '未知');
		const targetLabel = targetPort || '未检测到';
		const wan2LinkLabel = wan2Carrier === true ? '已连接' :
			(wan2Carrier === false ? '未连接' : '无法检测');
		const monitorLabel = wan2LinkMonitor !== '1' ? '拔出检测关闭' :
			(!monitorServiceRunning ? '持续检测服务未运行' :
			(failoverActive ?
				(wan2LinkRestore === '1' ? '故障转移中，插入后自动恢复' : '故障转移中，插入后保持仅 WAN1') :
				('持续检测服务运行中；插入恢复' + (wan2LinkRestore === '1' ? '开启' : '关闭'))));
		const statusText = '当前状态：' + label(actualMode) +
			(desiredMode === 'dual' ? '；WAN2 链路：' + wan2LinkLabel + '（自动检测：' + monitorLabel + '）' : '') +
			'；最后 LAN 口（' + targetLabel + '）→ ' + label(actualTarget) +
			'；2.4G → ' + label(actualWifi24) +
			'；5G → ' + label(actualWifi5) +
			(effectiveDesiredMode === 'dual' ? '；VPN/WAN2：' + vpnLabel : '') +
			'；与页面配置' + (consistent ? '一致' : '不一致，保存并应用后将自动修正');

		m = new form.Map('mwan-switch', 'WAN 端口切换',
			'页面只保存 UCI 选项，不直接执行命令。点击 LuCI 自带的“保存并应用”后，mwan-switch 服务会检测物理 LAN 口，并以 UCI 方式增量调整配置；端口或无线出口改变时会自动触发客户端重新获取 IPv4/IPv6。');

		s = m.section(form.NamedSection, 'main', 'settings', '切换设置');
		s.addremove = false;
		s.tab('basic', '基本设置');
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

		o = s.taboption('basic', form.Flag, 'vpn_wan2_isolation', '隔离 VPN 与 WAN2');
		o.default = '1';
		o.rmempty = false;
		o.depends('mode', 'dual');
		o.description = '开启时 tun0、tun1 等 tun+ 只能走 WAN1，并拒绝转发到 WAN2；关闭时允许 VPN 区域访问 WAN2，但不会把 VPN 默认路由强制改到 WAN2。';

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

		o = s.taboption('advanced', form.Flag, 'manage_luna', '管理最后 LAN 口固定设备');
		o.default = '1';
		o.rmempty = false;

		o = s.taboption('advanced', form.Value, 'luna_mac', '固定设备 MAC');
		o.datatype = 'macaddr';
		o.default = '66:89:48:AE:2D:9E';
		o.depends('manage_luna', '1');

		o = s.taboption('advanced', form.Value, 'luna_duid', '固定设备 IPv6 DUID');
		o.default = '00041f4077fde69db0d06d26583c13a4083e';
		o.depends('manage_luna', '1');

		o = s.taboption('advanced', form.Value, 'luna_ipv4_suffix', '固定 IPv4 末段');
		o.datatype = 'range(2,254)';
		o.default = '186';
		o.depends('manage_luna', '1');

		o = s.taboption('advanced', form.Value, 'luna_ipv6_suffix', '固定 IPv6 后缀');
		o.default = 'a186';
		o.depends('manage_luna', '1');

		o = s.taboption('advanced', form.Flag, 'wan1_access_lan4', '允许 WAN1 上级访问固定设备');
		o.default = '1';
		o.rmempty = false;
		o.depends('manage_luna', '1');

		o = s.taboption('advanced', form.DynamicList, 'wan2_dns4', 'WAN2 客户端 IPv4 DNS');
		o.datatype = 'ip4addr';

		o = s.taboption('advanced', form.DynamicList, 'wan2_dns6', 'WAN2 客户端 IPv6 DNS');
		o.datatype = 'ip6addr';

		o = s.taboption('advanced', form.DynamicList, 'luna_routes', '固定设备后方路由');
		o.datatype = 'cidr4';
		o.depends('manage_luna', '1');

		return m.render();
	}
});
