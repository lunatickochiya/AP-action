# LAN端口切换（luci-app-mwan-switch）

使用 UCI 增量管理 OpenWrt 双 WAN、最后一个 LAN 口、2.4G/5G 无线出口、DNS、VPN 隔离和 WAN2 物理链路故障切换。兼容 firewall3，不依赖 firewall4，也不会替换完整的 `network`、`dhcp`、`firewall` 或 `wireless` 配置文件。

当前版本：Release 15。

## 主要功能

- 自动检测名称为 `lanN` 的物理网口，默认将最高编号端口作为“最后一个 LAN 口”。
- 将 LAN1（可调整）作为 WAN2，支持 DHCP 或 PPPoE。
- PPPoE 页面只配置账号和密码，其余参数使用 OpenWrt/netifd 默认值。
- DHCP 和 PPPoE 默认自动获取 IPv6，也可以单独关闭 WAN2 IPv6。
- 最后一个 LAN 口、2.4G 和 5G 可分别选择 WAN1 或 WAN2。
- 主 LAN 和 WAN2 客户端分别提供 IPv4/IPv6 DNS 下拉列表，可逐条选择预置服务商地址或输入自定义地址。
- 使用一个下拉菜单选择 `tun0`、`tun1` 等 OpenVPN 接口需要隔离的出口。
- 可持续检测 WAN2 物理链路：拔出后临时恢复为仅 WAN1，重新插入后按选项恢复之前的双 WAN 配置。
- PPPoE WAN2 重新插入并拨号成功后自动重新激活 WAN1，恢复 WAN1 的默认路由、DNS 和 IPv6，不再需要手工重启 WAN。
- 页面通过 `network.interface dump` 显示 WAN2 的 IPv4、IPv6、IPv6-PD、物理链路和实际策略状态。
- 页面不提供自定义操作按钮；修改选项后使用 LuCI 自带的“保存并应用”。

Release 13 不再提供 IPv6 首选地址寿命上限和有效地址寿命上限。保存应用时会删除旧版本在 `dhcp.lan`、`dhcp.lan_wan2` 写入的 `max_preferred_lifetime`、`max_valid_lifetime`，后续由 odhcpd 和上游前缀的实际寿命决定。

应用也不再管理最后一个 LAN 口上的固定设备。首次应用会清理旧版本生成的 `mwan_luna*` 段及 `allow_wan1_to_lan4_device`，不会扫描或删除其他名称的手工 DHCP 静态租约、路由或防火墙规则。

## 页面使用

进入 LuCI：`网络 → LAN端口切换`。

- “基本设置”：工作模式、最后 LAN 口、2.4G/5G 出口和 WAN2 拔插监控。
- “WAN2 上网”：DHCP/PPPoE、账号密码和 WAN2 自动 IPv6。
- “DNS 设置”：主 LAN 与 WAN2 各自的 DNS 模式，以及可逐条增加的地址下拉列表。
- “高级设置”：VPN 出口隔离下拉菜单，以及物理端口、路由表、Radio 名称等参数。

状态栏分别显示 WAN2 协议及 IPv4 联网状态、PPPoE 地址、`wan2_6` 地址和 PD、网线状态、故障切换服务、最后 LAN 口、2.4G、5G 及两组 VPN 隔离的实际状态。

## 默认 UCI 配置

```text
config settings 'main'
	option mode 'dual'
	option target_lan_uplink 'wan2'
	option wifi24_uplink 'wan2'
	option wifi5_uplink 'wan'
	option vpn_isolation 'wan2'
	option wan2_link_monitor '0'
	option wan2_link_restore '1'
	option wan2_link_delay '10'
	option wan2_failover_active '0'
	option wan2_lan_ip '192.168.77.1'
	option wan2_table '200'
	option wan2_port 'lan1'
	option wan2_proto 'dhcp'
	option wan2_pppoe_username ''
	option wan2_pppoe_password ''
	option wan2_ipv6 '1'
	option lan_dns_mode 'custom'
	option wan2_dns_mode 'keep'
	option target_lan_port 'auto'
	option wifi24_radio 'radio0'
	option wifi5_radio 'radio1'
	list lan_dns4 '1.1.1.1'
	list lan_dns4 '8.8.8.8'
	list lan_dns4 '223.5.5.5'
	list lan_dns4 '9.9.9.9'
	list lan_dns6 '2606:4700:4700::1111'
	list lan_dns6 '2001:4860:4860::8888'
	list lan_dns6 '2400:3200::1'
	list lan_dns6 '2620:fe::fe'
	list wan2_dns4 '1.1.1.1'
	list wan2_dns4 '8.8.8.8'
	list wan2_dns4 '223.5.5.5'
	list wan2_dns4 '9.9.9.9'
	list wan2_dns6 '2606:4700:4700::1111'
	list wan2_dns6 '2001:4860:4860::8888'
	list wan2_dns6 '2400:3200::1'
	list wan2_dns6 '2620:fe::fe'
```

## DNS 设置

主 LAN 与 WAN2 分别使用 `lan_dns_mode`、`wan2_dns_mode`：

- `keep`：本应用不写入、删除或覆盖该网络当前已有的 DNS 项。
- `custom`：把对应 IPv4/IPv6 列表下发给客户端。WAN2 还会设置 `peerdns=0`，避免混入上级自动提供的 DNS。

主 LAN 默认使用自定义列表，WAN2 默认不修改。每个 DNS 字段都是可逐条增加的下拉列表：选择一个地址后使用列表的增加项继续添加，也可以直接输入其他合法地址。

默认写入的地址为：

- IPv4：`1.1.1.1`、`8.8.8.8`、`223.5.5.5`、`9.9.9.9`
- IPv6：`2606:4700:4700::1111`、`2001:4860:4860::8888`、`2400:3200::1`、`2620:fe::fe`

下拉菜单还提供 Cloudflare、Google、阿里和 Quad9 的备用 IPv4/IPv6 地址。下拉选项只是输入辅助，最终仍以标准 UCI `list lan_dns4`、`list lan_dns6`、`list wan2_dns4`、`list wan2_dns6` 保存。

从 `custom` 改为 `keep` 会保留已经生成的 UCI DNS 值，之后不再由本应用修改；如需移除它们，请在 LuCI 的 DHCP/DNS 或接口页面手工调整。

命令行修改 WAN2 DNS 示例：

```sh
uci set mwan-switch.main.wan2_dns_mode='custom'
uci -q delete mwan-switch.main.wan2_dns4
uci add_list mwan-switch.main.wan2_dns4='1.1.1.1'
uci add_list mwan-switch.main.wan2_dns4='8.8.8.8'
uci -q delete mwan-switch.main.wan2_dns6
uci add_list mwan-switch.main.wan2_dns6='2606:4700:4700::1111'
uci add_list mwan-switch.main.wan2_dns6='2001:4860:4860::8888'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

## WAN2 DHCP、PPPoE 与 IPv6

DHCP 模式使用静态 IPv6 接口：

```text
config interface 'wan2_6'
	option device '@wan2'
	option proto 'dhcpv6'
	option reqaddress 'try'
	option reqprefix 'auto'
	option ip6table '200'
```

PPPoE 模式只向 `network.wan2` 写入账号和密码，不设置 `mtu`、`keepalive`、`holdoff`、`service` 等高级参数。自动 IPv6 开启时保持 PPP 协议默认的 `ipv6=auto`，由 netifd 在每次拨号建立后动态创建运行时 `wan2_6`；关闭时才写入 `option ipv6 '0'`。

```sh
uci set mwan-switch.main.mode='dual'
uci set mwan-switch.main.wan2_proto='pppoe'
uci set mwan-switch.main.wan2_pppoe_username='宽带账号'
uci set mwan-switch.main.wan2_pppoe_password='宽带密码'
uci set mwan-switch.main.wan2_ipv6='1'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

WAN2 上级需要提供 DHCPv6-PD。`ifstatus wan2_6` 只有 IPv6 地址、没有 `ipv6-prefix` 时，路由器本身可能已经联网，但不能向最后一个 LAN 口或无线客户端下发公网 IPv6 前缀。

## VPN 隔离

“高级设置”使用一个 `vpn_isolation` 下拉菜单：

- `none`：不隔离，VPN 可以使用 WAN1 和 WAN2。
- `wan1`：隔离 WAN1，VPN 仅允许使用 WAN2。
- `wan2`：隔离 WAN2，VPN 仅允许使用 WAN1；这是默认值。
- `both`：同时隔离 WAN1 和 WAN2。

升级后首次保存应用会把旧版 `vpn_wan1_isolation`、`vpn_wan2_isolation` 组合无损迁移到新字段并删除旧字段。实际 firewall3 转发和拒绝规则保持原有实现。

## 状态检查

```sh
ifstatus wan2
ifstatus wan2_6
ubus call network.interface dump
logread -e pppd
logread -e odhcp6c
ip -4 route show table 200
ip -6 route show table 200
/etc/init.d/mwan-switch check
```

PPPoE 获得 IPv4 后，状态栏会显示实际地址。只有 `wan2_6` 获得 `ipv6-prefix` 才代表上游提供了可供下游使用的 IPv6-PD。

## 编译与安装

Makefile 仅声明 `luci-base`、`rpcd` 和 `uci`，不会强制引入 `odhcp6c`、`ppp`、`ppp-mod-pppoe`。使用 WAN2 DHCPv6 或 PPPoE 前，请确认固件自身已经包含对应运行组件；缺少时由固件维护者按目标版本单独选入。

将目录复制到 OpenWrt 源码的 `package/`，选择 `LuCI → Applications → luci-app-mwan-switch` 后编译：

```sh
make package/luci-app-mwan-switch/compile V=s
opkg install /tmp/luci-app-mwan-switch_*.ipk
```

## 不编译直接测试 LuCI

将整个 `luci-app-mwan-switch` 目录上传到路由器 `/tmp/luci-app-mwan-switch`，通过 SSH 进入该目录后执行：

```sh
cd /tmp/luci-app-mwan-switch

mkdir -p /www/luci-static/resources/view/mwan-switch
mkdir -p /usr/share/luci/menu.d /usr/share/rpcd/acl.d
mkdir -p /etc/init.d /etc/uci-defaults

cp -f htdocs/luci-static/resources/view/mwan-switch/settings.js /www/luci-static/resources/view/mwan-switch/settings.js
cp -f root/usr/share/luci/menu.d/luci-app-mwan-switch.json /usr/share/luci/menu.d/luci-app-mwan-switch.json
cp -f root/usr/share/rpcd/acl.d/luci-app-mwan-switch.json /usr/share/rpcd/acl.d/luci-app-mwan-switch.json
cp -f root/etc/init.d/mwan-switch /etc/init.d/mwan-switch
cp -f root/etc/init.d/mwan-switch-monitor /etc/init.d/mwan-switch-monitor
cp -f root/etc/uci-defaults/40_luci-app-mwan-switch /etc/uci-defaults/40_luci-app-mwan-switch

chmod 0755 /etc/init.d/mwan-switch /etc/init.d/mwan-switch-monitor
chmod 0755 /etc/uci-defaults/40_luci-app-mwan-switch

[ -e /etc/config/mwan-switch ] || cp root/etc/config/mwan-switch /etc/config/mwan-switch
/etc/uci-defaults/40_luci-app-mwan-switch && rm -f /etc/uci-defaults/40_luci-app-mwan-switch

rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

仅调试页面 JavaScript 时，只需重复复制 `settings.js`、清理两个 LuCI 缓存目录并在浏览器强制刷新。测试完成后首次点击“保存并应用”会按当前选项修改网络；操作前应备份 `/etc/config/network`、`dhcp`、`firewall`、`wireless` 和 `mwan-switch`。

从旧 IPK 升级时建议：

```sh
opkg install --force-reinstall /tmp/luci-app-mwan-switch_*.ipk
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

应用配置会重载网络，当前 LuCI 或 SSH 连接可能短暂中断。
