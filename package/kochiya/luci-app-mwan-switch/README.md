# luci-app-mwan-switch

使用 UCI 管理 OpenWrt 双 WAN、最后一个 LAN 口、2.4G/5G 无线出口、VPN 隔离和 WAN2 物理链路故障切换。兼容 firewall3，不依赖 firewall4。

当前版本：Release 12。

## 主要功能

- 自动检测名称为 `lanN` 的物理网口，默认将最高编号端口作为最后一个 LAN 口。
- 将 LAN1（可调整）作为 WAN2，支持 DHCP 或 PPPoE。
- PPPoE 页面只配置账号和密码，MTU、LCP、重拨间隔、服务名等使用 OpenWrt/netifd 默认值。
- WAN2 默认自动获取 IPv6，也可在页面关闭。
- DHCP 模式使用静态 `wan2_6` 接口并绑定 `@wan2`。
- PPPoE 模式使用 netifd 的自动 IPv6；每次 PPP 链路建立后动态创建 `wan2_6`，重拨后自动恢复 DHCPv6 地址和 PD。
- DNS 可选择“不修改现有 DNS”或为 WAN2 客户端设置独立 IPv4/IPv6 DNS。
- 页面通过 `network.interface dump` 读取 WAN2 运行状态，显示 PPPoE IPv4、IPv6 地址及 IPv6-PD 状态。
- 最后一个 LAN 口、2.4G 和 5G 可分别选择 WAN1 或 WAN2。
- 可隔离 `tun0`、`tun1` 等 OpenVPN 接口与 WAN2，VPN 默认继续走 WAN1。
- 可持续检测 WAN2 物理链路，拔出后临时切换为仅 WAN1，重新插入后按选项恢复原配置。
- 页面不提供自定义切换按钮，修改选项后使用 LuCI 自带的“保存并应用”。

Release 12 不再管理最后一个 LAN 口上的固定设备。首次应用时会删除旧版本生成的以下 UCI 段：

- `dhcp.mwan_luna`
- `network.mwan_luna_route_*`
- `firewall.mwan_luna_51198`
- `firewall.mwan_luna_ipv6`
- `firewall.allow_wan1_to_lan4_device`

其他手工创建的 DHCP 静态租约、路由和防火墙规则不会被扫描或删除。

## 页面使用

进入 LuCI：`网络 → WAN 端口切换`。

“基本设置”用于选择工作模式、最后 LAN 口和无线出口、VPN 隔离及 WAN2 拔插监控。“WAN2 上网”用于选择 DHCP/PPPoE、填写 PPPoE 账号密码、控制自动 IPv6 和 DNS。“高级设置”用于调整物理端口、路由表、Radio 名称和下游 IPv6 寿命。

状态栏分别显示：

- WAN2 协议和 IPv4 联网状态；
- PPPoE 获取到的 IPv4 地址；
- `wan2_6` 是否启动、是否获得 IPv6 地址或 IPv6-PD；
- WAN2 物理网线状态和故障切换服务状态；
- 最后 LAN 口、2.4G、5G 和 VPN 隔离的实际状态。

## 默认 UCI 配置

```text
config settings 'main'
	option mode 'dual'
	option target_lan_uplink 'wan2'
	option wifi24_uplink 'wan2'
	option wifi5_uplink 'wan'
	option vpn_wan2_isolation '1'
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
	option wan2_dns_mode 'keep'
	option target_lan_port 'auto'
	option wifi24_radio 'radio0'
	option wifi5_radio 'radio1'
	option ipv6_preferred_lifetime '24h'
	option ipv6_valid_lifetime '24h'
	list wan2_dns4 '223.5.5.5'
	list wan2_dns4 '223.6.6.6'
	list wan2_dns6 '2400:3200::1'
	list wan2_dns6 '2400:3200:baba::1'
```

`wan2_dns_mode='keep'` 表示本应用不写入、删除或覆盖主 LAN、WAN2 上联和 WAN2 客户端的 DNS 选项。`custom` 才会让主 LAN 使用路由器地址作为 DNS、禁用 WAN2 对端 DNS，并把页面填写的 DNS 下发给使用 WAN2 的客户端。

`wan2_ipv6='1'` 默认开启自动 IPv6；设置为 `0` 时删除/停用 `wan2_6`、WAN2 下游 RA/DHCPv6、IPv6 策略规则和相关 firewall3 放行规则。

## PPPoE 生成方式

PPPoE 模式只向 `network.wan2` 写入账号和密码：

```text
config interface 'wan2'
	option device 'lan1'
	option proto 'pppoe'
	option username '宽带账号'
	option password '宽带密码'
	option ip4table '200'
	option ip6table '200'
```

应用不会设置 PPPoE 的 `mtu`、`keepalive`、`holdoff`、`persist`、`maxfail`、`service` 或 `ac`。自动 IPv6 开启时也不会写 `ipv6`，因为 OpenWrt PPP 协议缺省值 `auto` 会在 `ppp6-up` 中动态创建 `wan2_6`。关闭自动 IPv6 时才写入 `option ipv6 '0'`。

DHCP 模式的 IPv6 接口为：

```text
config interface 'wan2_6'
	option device '@wan2'
	option proto 'dhcpv6'
	option reqaddress 'try'
	option reqprefix 'auto'
	option ip6table '200'
```

## 命令行配置

启用 WAN2 PPPoE 和自动 IPv6：

```sh
uci set mwan-switch.main.mode='dual'
uci set mwan-switch.main.wan2_proto='pppoe'
uci set mwan-switch.main.wan2_pppoe_username='宽带账号'
uci set mwan-switch.main.wan2_pppoe_password='宽带密码'
uci set mwan-switch.main.wan2_ipv6='1'
uci set mwan-switch.main.wan2_dns_mode='keep'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

使用自定义 WAN2 DNS：

```sh
uci set mwan-switch.main.wan2_dns_mode='custom'
uci -q delete mwan-switch.main.wan2_dns4
uci add_list mwan-switch.main.wan2_dns4='223.5.5.5'
uci -q delete mwan-switch.main.wan2_dns6
uci add_list mwan-switch.main.wan2_dns6='2400:3200::1'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

## 检查状态

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

PPPoE 重拨成功后，`ifstatus wan2` 应显示 IPv4 地址；开启自动 IPv6 时，运行时接口 `wan2_6` 应重新出现。只有获得 `ipv6-prefix` 才表示运营商已经提供可下发到最后 LAN 口或无线客户端的 IPv6-PD。

## 编译与安装

依赖：`luci-base`、`rpcd`、`uci`、`odhcp6c`、`ppp`、`ppp-mod-pppoe`。将目录复制到 OpenWrt 源码的 `package/` 后选择 `LuCI → Applications → luci-app-mwan-switch` 编译。

```sh
make package/luci-app-mwan-switch/compile V=s
opkg install /tmp/luci-app-mwan-switch_*.ipk
```

从旧版本升级后建议清理 LuCI 缓存：

```sh
opkg install --force-reinstall /tmp/luci-app-mwan-switch_*.ipk
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

应用配置会重载网络，当前 LuCI 或 SSH 连接可能短暂中断。实际部署前应备份 `/etc/config/network`、`dhcp`、`firewall`、`wireless` 和 `mwan-switch`。
