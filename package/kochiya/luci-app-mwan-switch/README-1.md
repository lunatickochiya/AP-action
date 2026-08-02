# luci-app-mwan-switch

这是一个面向 OpenWrt DSA 端口布局的声明式 LuCI 应用。页面只修改 `/etc/config/mwan-switch`，没有自定义执行按钮；点击 LuCI 自带的“保存并应用”后，由 `/etc/init.d/mwan-switch` 检查实际状态，再通过 `uci` 增量修改 `network`、`dhcp`、`firewall` 和 `wireless`。

应用不会用模板复制或替换 OpenWrt 原有配置文件。

## 功能

- 自动检测名称为 `lanN` 的物理网口数量，最高编号端口作为“最后一个 LAN 口”；也可在高级设置中手工指定。
- 页面显示每个 LAN 物理口的插线状态、协商速率和当前用途。
- 将 LAN1（高级设置可调整）切换为 DHCP/DHCPv6-PD WAN2。
- 两个独立选项控制 WAN2 自动切换：一项控制拔出后临时切换为仅 WAN1，另一项控制重新插入后是否恢复此前的双 WAN、端口、无线和 VPN 配置。
- 勾选第一项后启用独立的 `mwan-switch-monitor` procd 服务持续检测 WAN2；取消勾选后自动停止并禁用该服务，服务异常退出时由 procd 自动拉起。
- 自动故障期间只改变隐藏的 UCI 状态 `wan2_failover_active`，不会覆盖用户保存的 `mode` 和各出口选项；WAN2 物理口使用无地址的隔离探测接口，不桥接进主 LAN，避免重新插入上级路由时发生 DHCP 冲突。
- 将最后一个 LAN 口、2.4G 无线、5G 无线分别在 WAN1 和 WAN2 之间切换。
- VPN/WAN2 隔离开关：开启时 `tun0`、`tun1` 等 `tun+` 只允许转发到 WAN1，并拒绝 WAN2；关闭时允许 VPN 区域访问 WAN2，但不改变 VPN 默认出口仍走 WAN1 的策略。
- 恢复“仅 WAN1”时，WAN2 物理口、最后 LAN 口、2.4G 和 5G 全部回到现有 `lan`，并删除应用管理的 WAN2 接口、区域和策略规则。
- WAN2 使用独立 IPv4/IPv6 路由表；WAN1/WAN2 的 IPv6 前缀类别分离并启用源地址过滤。
- WAN2 内网启用 RA、SLAAC、DHCPv6，关闭桥组播 snooping，2.4G/5G 选择 WAN2 后可获取其 IPv6 前缀。
- WAN2 客户端使用独立 DNS，避免 WAN1/WAN2 上游 DNS 混用导致解析问题。
- 根据最后 LAN 口所属网络自动调整固定设备的 `.186`、`::a186`、后方静态路由和端口映射。
- 最后 LAN 口在 WAN1/WAN2 之间切换后自动执行软件链路重置，使固定设备立即重新获取 `.186` 和对应 IPv6，不需要人工重新插拔网线。
- 2.4G 或 5G 出口变化后只重启发生变化的 Radio，客户端自动重新关联并获取新出口的 IPv4/IPv6，不需要手工重连无线。
- 每次相关 UCI 配置保存应用时重新检查并收敛状态；重复应用不会重复增加 UCI 段。

## 页面使用

进入 LuCI：`网络 → WAN 端口切换`。

页面顶部显示：

- 检测到的 LAN 网口数量及自动选中的最后端口；
- 各端口已连接/未连接、链路速率和当前用途；
- 最后 LAN 口、2.4G、5G 和 VPN 隔离的实际状态；
- WAN2 物理链路以及当前是否处于自动故障转移；
- 实际状态是否与页面期望一致。

页面没有“切换”按钮。修改选项后统一点击 LuCI 自带的“保存并应用”。首次切换物理端口时网络会重载，LuCI 或 SSH 可能短暂断开。

## 默认 UCI 配置

应用新增 `/etc/config/mwan-switch`：

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
	option target_lan_port 'auto'
	option wifi24_radio 'radio0'
	option wifi5_radio 'radio1'
```

`target_lan_port='auto'` 会在每次应用和状态检查时重新扫描 `/sys/class/net/lanN`，选择数字最大的端口。旧版 `lan4_uplink`/`lan4_port` 配置仍可读取；保存新页面后会使用新的通用选项。

`wan2_link_monitor='1'` 开启“拔出后自动仅 WAN1”，`wan2_link_restore='1'` 开启“插入后恢复之前配置”。如果恢复选项为 `0`，重新插入只更新链路显示，路由器继续保持仅 WAN1。`wan2_link_delay` 是拔出和重新插入的状态确认秒数，范围 4～300 秒。`wan2_failover_active` 由服务自动管理，不需要手工修改。

高级设置还包括固定设备 MAC/DUID、IP 后缀、WAN1 上级访问开关、WAN2 DNS 和固定设备后方路由。

## 编译 IPK

要求使用 JavaScript 版 LuCI，并提供 firewall3 或 firewall4。将整个目录复制到 OpenWrt 源码的 `package/` 后执行：

```sh
cp -a luci-app-mwan-switch <openwrt源码>/package/
cd <openwrt源码>
./scripts/feeds update luci
./scripts/feeds install luci-base
make menuconfig
make package/luci-app-mwan-switch/compile V=s
```

在 `make menuconfig` 中选择 `LuCI → Applications → luci-app-mwan-switch`。生成的包位于对应架构的软件包输出目录。

## 安装

OpenWrt 24.10 及更早版本通常使用：

```sh
opkg install /tmp/luci-app-mwan-switch_*.ipk
```

从旧版升级可使用：

```sh
opkg install --force-reinstall /tmp/luci-app-mwan-switch_*.ipk
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 不编译时直接部署

以下命令只安装应用自身文件，不复制或替换原有四个 OpenWrt 配置文件：

```sh
cp -a root/* /
cp -a htdocs/* /www/
chmod 0755 /etc/init.d/mwan-switch
chmod 0755 /etc/init.d/mwan-switch-monitor
chmod 0755 /etc/uci-defaults/40_luci-app-mwan-switch
/etc/uci-defaults/40_luci-app-mwan-switch
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 命令行示例

启用 WAN2，最后 LAN 口与 2.4G 走 WAN2，5G 走 WAN1，并隔离 VPN/WAN2：

```sh
uci set mwan-switch.main.mode='dual'
uci set mwan-switch.main.target_lan_port='auto'
uci set mwan-switch.main.target_lan_uplink='wan2'
uci set mwan-switch.main.wifi24_uplink='wan2'
uci set mwan-switch.main.wifi5_uplink='wan'
uci set mwan-switch.main.vpn_wan2_isolation='1'
uci set mwan-switch.main.wan2_link_monitor='1'
uci set mwan-switch.main.wan2_link_restore='1'
uci set mwan-switch.main.wan2_link_delay='10'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

关闭 VPN/WAN2 隔离：

```sh
uci set mwan-switch.main.vpn_wan2_isolation='0'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

关闭 WAN2 拔插自动切换：

```sh
uci set mwan-switch.main.wan2_link_monitor='0'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

如果此时正处于自动故障状态，服务会清除故障状态并按页面保存的双 WAN 配置重新应用。手工选择“仅 WAN1”则会停止自动恢复，并把 WAN2 物理口恢复为普通 LAN。

只关闭重新插入后的自动恢复：

```sh
uci set mwan-switch.main.wan2_link_restore='0'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

此时仍会在 WAN2 拔出后切换为仅 WAN1，但重新插入不会恢复，直到重新开启恢复选项或关闭拔出检测并保存应用。

恢复仅 WAN1：

```sh
uci set mwan-switch.main.mode='wan_only'
uci commit mwan-switch
/etc/init.d/mwan-switch apply
```

只检查、不修改：

```sh
/etc/init.d/mwan-switch check
logread -e mwan-switch
```

检查成功时会同时输出检测到的 LAN 端口数量和当前目标端口。

## IPv6 上游冲突说明

应用会保持 WAN1/WAN2 的 IPv6 前缀类别、源过滤和路由表隔离。如果两台上级路由实际下发相同或重叠的 DHCPv6-PD 前缀，软件不能消除上级本身的前缀重复；必须修改其中一个上级的 IPv6 前缀，或关闭其中一条上联的 IPv6。

## 卸载前恢复

先在页面选择“仅使用 WAN1”并保存应用，或执行恢复命令。确认 WAN2 物理口、最后 LAN 口和无线均回到 WAN1 后，再禁用服务并卸载软件包。
