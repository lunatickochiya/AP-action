#!/bin/bash
#=================================================
# this script is from https://github.com/lunatickochiya/Lunatic-s805-rockchip-Action
# Written By lunatickochiya
# QQ group :286754582  https://jq.qq.com/?_wv=1027&k=5QgVYsC
#=================================================

autosetver() {
version=21.02
sed -i "52i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-meson
sed -i "51i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-mediatek
sed -i "51i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-ramips
sed -i "52i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-rockchip
sed -i "51i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-rockchip-siderouter

grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-mediatek
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-meson
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-rockchip
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-ramips
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-rockchip-siderouter
        }

function remove_error_package() {

packages=(
    "luci-app-dockerman"
    "rtl8821cu"
    "xray-core"
)

for package in "${packages[@]}"; do
        echo "卸载软件包 $package ..."
        ./scripts/feeds uninstall $package
        echo "软件包 $package 已卸载。"
done

directories=(
    "feeds/luci/applications/luci-app-dockerman"
    "feeds/kiddin9/rtl8821cu"
    "feeds/packages/net/xray-core"
)

for directory in "${directories[@]}"; do
    if [ -d "$directory" ]; then
        echo "目录 $directory 存在，进行删除操作..."
        rm -r "$directory"
        echo "目录 $directory 已删除。"
    else
        echo "目录 $directory 不存在。"
    fi
done
rm -rf tmp
./scripts/feeds update -i
./scripts/feeds install -a -d y
        }

function remove_error_package_not_install() {

packages=(
    "luci-app-dockerman"
    "rtl8821cu"
    "xray-core"
)

for package in "${packages[@]}"; do
        echo "卸载软件包 $package ..."
        ./scripts/feeds uninstall $package
        echo "软件包 $package 已卸载。"
done

directories=(
    "feeds/luci/applications/luci-app-dockerman"
    "feeds/kiddin9/rtl8821cu"
    "feeds/packages/net/xray-core"
    "feeds/kiddin9/dae"
    "feeds/kiddin9/daed"
    "feeds/kiddin9/daed-next"
    "feeds/kiddin9/luci-app-apinger"
    "feeds/kiddin9/luci-app-daed"
    "feeds/kiddin9/luci-app-daed-next"
    "feeds/kiddin9/dufs"
    "feeds/kiddin9/luci-app-dufs"
    "feeds/kiddin9/pcat-manager"
    "feeds/kiddin9/rustdesk-server"
    "feeds/kiddin9/shadowsocks-rust"
    "feeds/kiddin9/spotifyd"
    "feeds/kiddin9/luci-app-spotifyd"
    "feeds/kiddin9/luci-app-music-remote-center"
    "feeds/kiddin9/tuic-server"
    "feeds/kiddin9/firewall4"
    "feeds/kiddin9/luci-app-lorawan-basicstation"
    "feeds/kiddin9/luci-app-keepalived"
    "feeds/kiddin9/luci-app-rclone"
    "feeds/kiddin9/sing-box"
    "feeds/kiddin9/luci-app-passwall2"
)

for directory in "${directories[@]}"; do
    if [ -d "$directory" ]; then
        echo "目录 $directory 存在，进行删除操作..."
        rm -r "$directory"
        echo "目录 $directory 已删除。"
    else
        echo "目录 $directory 不存在。"
    fi
done

rm -rf tmp
rm -rf logs
echo "升级索引"

./scripts/feeds update -i

for package2 in "${packages[@]}"; do
        echo "安装软件包 $package2 ..."
        ./scripts/feeds install $package2
        echo "软件包 $package2 已经重新安装。"
done
        }

function patch_openwrt() {
        for i in $( ls mypatch ); do
            echo Applying mypatch $i
            patch -p1 --no-backup-if-mismatch < mypatch/$i
        done
        }
function patch_package() {
        for packagepatch in $( ls feeds/packages/feeds-package-patch-2305 ); do
            cd feeds/packages/
            echo Applying feeds-package-patch-2305 $packagepatch
            patch -p1 --no-backup-if-mismatch < feeds-package-patch-2305/$packagepatch
            cd ../..
        done
        }
function patch_luci() {
        for lucipatch in $( ls feeds/luci/luci-patch-2305 ); do
            cd feeds/luci/
            echo Applying luci-patch-2305 $lucipatch
            patch -p1 --no-backup-if-mismatch < luci-patch-2305/$lucipatch
            cd ../..
        done
        }
function patch_kiddin9() {
        for kiddin9patch in $( ls feeds/kiddin9/kiddin9-revert ); do
            cd feeds/kiddin9/
            echo Revert kiddin9 $kiddin9patch
            patch -p1 -R --no-backup-if-mismatch < kiddin9-revert/$kiddin9patch
            cd ../..
        done
        }

function patch_rockchip() {
        for rockpatch in $( ls tpm312/core ); do
            echo Applying tpm312 $rockpatch
            patch -p1 --no-backup-if-mismatch < tpm312/core/$rockpatch
        done
        rm -rf tpm312
        }

function remove_firewall() {

directories1=(
    "package/network/config/firewall"
    "package/network/config/firewall4"
)

for directory1 in "${directories1[@]}"; do
    if [ -d "$directory1" ]; then
        echo "目录 $directory1 存在，进行删除操作..."
        rm -r "$directory1"
        echo "目录 $directory1 已删除。"
    else
        echo "目录 $directory1 不存在。"
    fi
done
        }

# add luci

function add_ath79_nand_2102_packages() {
echo "$(cat package-configs/ath79-nand-2102-common.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_ramips_mt7620_2102_packages() {
echo "$(cat package-configs/ramips-mt7620-2102-common.config)" >> package-configs/.config
mv -f package-configs/.config .config
}


if [ "$1" == "ws1508-istore" ]; then
autosetver
remove_error_package
patch_openwrt
patch_package
patch_luci
patch_kiddin9
add_full_istore_luci_for_ws1508
elif [ "$1" == "ath79-nand-2102" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_kiddin9
add_ath79_nand_2102_packages
elif [ "$1" == "ramips-mt7620-2102" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_kiddin9
add_ramips_mt7620_2102_packages
elif [ "$1" == "patchop" ]; then
patch_openwrt
elif [ "$1" == "firewallremove" ]; then
remove_firewall
else
echo "Invalid argument"
fi