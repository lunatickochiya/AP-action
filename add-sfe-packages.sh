#!/bin/bash
#=================================================
# this script is from https://github.com/lunatickochiya/Lunatic-s805-rockchip-Action
# Written By lunatickochiya
# QQ group :286754582  https://jq.qq.com/?_wv=1027&k=5QgVYsC
#=================================================
function add_nft_config() {
for file in package-configs/*-nftables.config; do     echo "# ADD TURBOACC
CONFIG_PACKAGE_luci-app-turboacc=y
CONFIG_PACKAGE_luci-app-turboacc_INCLUDE_PDNSD=n

#offload
CONFIG_PACKAGE_kmod-nft-offload=y

# sfe
CONFIG_PACKAGE_kmod-fast-classifier=y
CONFIG_PACKAGE_kmod-shortcut-fe=y
CONFIG_PACKAGE_kmod-shortcut-fe-cm=n
CONFIG_PACKAGE_kmod-nft-fullcone=y

" >> "$file"; done
}

function add_ipt_config() {
for file in package-configs/*-iptables.config; do     echo "# ADD TURBOACC
CONFIG_PACKAGE_luci-app-turboacc-ipt=y
CONFIG_PACKAGE_luci-app-turboacc-ipt_INCLUDE_PDNSD=n
# CONFIG_PACKAGE_luci-app-fullconenat=y

#offload
CONFIG_PACKAGE_kmod-ipt-offload=y
# sfe
CONFIG_PACKAGE_kmod-fast-classifier=y
CONFIG_PACKAGE_kmod-shortcut-fe=y
CONFIG_PACKAGE_kmod-shortcut-fe-cm=n
" >> "$file"; done
}

function add_docker_ipq_config() {
for file in package-configs/*ipq*.config; do     echo "# docker组件
CONFIG_PACKAGE_dockerd=y
CONFIG_PACKAGE_docker-compose=y
CONFIG_DOCKER_CHECK_CONFIG=y
CONFIG_DOCKER_CGROUP_OPTIONS=y
CONFIG_DOCKER_OPTIONAL_FEATURES=y
CONFIG_DOCKER_NET_OVERLAY=y
CONFIG_DOCKER_NET_ENCRYPT=y
CONFIG_DOCKER_NET_MACVLAN=y
CONFIG_DOCKER_NET_TFTP=y
CONFIG_DOCKER_STO_DEVMAPPER=y
CONFIG_DOCKER_STO_EXT4=y
CONFIG_DOCKER_STO_BTRFS=y
# end

CONFIG_PACKAGE_luci-app-dockerman=y
" >> "$file"; done
}

function add_ipq_turboacc_ipt_config_nosfe() {
for file in package-configs/*ipq*.config; do     echo "# ADD TURBOACC
CONFIG_PACKAGE_luci-app-turboacc-ipt=y
# CONFIG_PACKAGE_luci-app-turboacc-ipt_INCLUDE_PDNSD is not set
# CONFIG_PACKAGE_luci-app-turboacc-ipt_INCLUDE_SHORTCUT_FE_DRV is not set
" >> "$file"; done
}

function add_ipq_turboacc_nft_config_nosfe() {
for file in package-configs/*ipq*.config; do     echo "# ADD TURBOACC
CONFIG_PACKAGE_luci-app-turboacc=y
# CONFIG_PACKAGE_luci-app-turboacc_INCLUDE_PDNSD is not set
# CONFIG_PACKAGE_luci-app-turboacc_INCLUDE_SHORTCUT_FE_DRV is not set
" >> "$file"; done
}

function add_ipq_turboacc_ipt_config_sfe() {
for file in package-configs/*ipq*.config; do     echo "# ADD TURBOACC
CONFIG_PACKAGE_luci-app-turboacc-ipt=y
# CONFIG_PACKAGE_luci-app-turboacc-ipt_INCLUDE_PDNSD is not set
" >> "$file"; done
}

function add_ipq_turboacc_nft_config_sfe() {
for file in package-configs/*ipq*.config; do     echo "# ADD TURBOACC
CONFIG_PACKAGE_luci-app-turboacc=y
# CONFIG_PACKAGE_luci-app-turboacc_INCLUDE_PDNSD is not set
" >> "$file"; done
}

function add_sfe_core_config() {
for file in package-configs/*-iptables.config; do     echo "# ADD TURBOACC

CONFIG_PACKAGE_kmod-fast-classifier=y
CONFIG_PACKAGE_kmod-shortcut-fe=y
CONFIG_PACKAGE_kmod-shortcut-fe-cm=y
" >> "$file"; done
echo "---------sfe-core--"
}

function add_lunatic_lede_core_config() {
for file in package-configs/*-iptables.config; do     echo "# ADD Lunatic
CONFIG_PACKAGE_kmod-zram=y

CONFIG_PACKAGE_zram-swap=y

CONFIG_PACKAGE_wpad-openssl=y
# CONFIG_PACKAGE_wpad-mini is not set

CONFIG_PACKAGE_luci-app-qos-gargoyle=y
CONFIG_PACKAGE_luci-app-sfe=y
CONFIG_PACKAGE_luci-theme-material=y
CONFIG_LUCI_LANG_zh-cn=y
" >> "$file"; done
echo "---------lunatic-lede-config-core--"
}


if [ "$1" == "nft" ]; then
add_nft_config
elif [ "$1" == "ipt" ]; then
add_ipt_config
elif [ "$1" == "sfe-core" ]; then
add_sfe_core_config
elif [ "$1" == "ipq-docker" ]; then
add_docker_ipq_config
elif [ "$1" == "ipq-ipt-turboacc-sfe" ]; then
add_ipq_turboacc_ipt_config_sfe
elif [ "$1" == "ipq-nft-turboacc-sfe" ]; then
add_ipq_turboacc_nft_config_sfe
elif [ "$1" == "ipq-ipt-turboacc-nosfe" ]; then
add_ipq_turboacc_ipt_config_nosfe
elif [ "$1" == "ipq-nft-turboacc-nosfe" ]; then
add_ipq_turboacc_nft_config_nosfe
elif [ "$1" == "lunatic-lede-config" ]; then
add_lunatic_lede_core_config
else
echo "Invalid argument"
fi
