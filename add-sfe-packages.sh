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

CONFIG_PACKAGE_wpad-mesh-openssl=y
# CONFIG_PACKAGE_wpad-mini is not set

CONFIG_PACKAGE_luci-app-qos-gargoyle=y
CONFIG_PACKAGE_luci-app-sfe=y
CONFIG_PACKAGE_luci-theme-material=y
CONFIG_LUCI_LANG_zh-cn=y
CONFIG_PACKAGE_curl=m
CONFIG_PACKAGE_wget-ssl=m
CONFIG_PACKAGE_luci-lib-ipkg=m
" >> "$file"; done
echo "---------lunatic-lede-config-core--"
}

function add_lunatic_lede_sdk_config() {
for file in package-configs/*tables.config; do     echo "# ADD SDK
CONFIG_SDK=y
" >> "$file"; done
echo "----------sdk-added------"
}

function add_lunatic_lede_ib_config() {
for file in package-configs/*tables.config; do     echo "# ADD SDK
CONFIG_IB=y
" >> "$file"; done
echo "-----------ib-added------"
}

if [ "$1" == "nft" ]; then
add_nft_config
elif [ "$1" == "ipt" ]; then
add_ipt_config
elif [ "$1" == "sfe-core" ]; then
add_sfe_core_config
elif [ "$1" == "lunatic-lede-config" ]; then
add_lunatic_lede_core_config
elif [ "$1" == "lunatic-lede-sdk" ]; then
add_lunatic_lede_sdk_config
elif [ "$1" == "lunatic-lede-ib" ]; then
add_lunatic_lede_ib_config
else
echo "Invalid argument"
fi
