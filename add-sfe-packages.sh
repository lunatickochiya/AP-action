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

function add_ipq_firmware_11_4() {
for file in package-configs/*ipq*.config; do     echo "# NSS
CONFIG_NSS_FIRMWARE_VERSION_11_4=y
" >> "$file"; done
echo "-----------114-added------"
}

function add_ipq_firmware_12_1() {
for file in package-configs/*ipq*.config; do     echo "# NSS
CONFIG_NSS_FIRMWARE_VERSION_11_4=n
CONFIG_NSS_FIRMWARE_VERSION_12_1=y
" >> "$file"; done
echo "-----------121-added------"
}

function add_ipq_firmware_12_2() {
for file in package-configs/*ipq*.config; do     echo "# NSS
CONFIG_NSS_FIRMWARE_VERSION_11_4=n
CONFIG_NSS_FIRMWARE_VERSION_12_2=y
" >> "$file"; done
echo "-----------122-added------"
}

function add_ipq_firmware_12_5() {
for file in package-configs/*ipq*.config; do     echo "# NSS
CONFIG_NSS_FIRMWARE_VERSION_11_4=n
CONFIG_NSS_FIRMWARE_VERSION_12_5=y
" >> "$file"; done
echo "-----------125-added------"
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
elif [ "$1" == "ipq-nss-11-4" ]; then
add_ipq_firmware_11_4
elif [ "$1" == "ipq-nss-12-1" ]; then
add_ipq_firmware_12_1
elif [ "$1" == "ipq-nss-12-2" ]; then
add_ipq_firmware_12_2
elif [ "$1" == "ipq-nss-12-5" ]; then
add_ipq_firmware_12_5
elif [ "$1" == "lunatic-lede-config" ]; then
add_lunatic_lede_core_config
elif [ "$1" == "lunatic-lede-sdk" ]; then
add_lunatic_lede_sdk_config
elif [ "$1" == "lunatic-lede-ib" ]; then
add_lunatic_lede_ib_config
else
echo "Invalid argument"
fi
