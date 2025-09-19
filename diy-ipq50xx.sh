#!/bin/bash
#=================================================
# this script is from https://github.com/lunatickochiya/Lunatic-s805-rockchip-Action
# Written By lunatickochiya
# QQ group :286754582  https://jq.qq.com/?_wv=1027&k=5QgVYsC
#=================================================


function autosetver() {
    version=21.02

    # 在文件的 'exit 0' 之前插入 DISTRIB_DESCRIPTION 信息
    sed -i "/^exit 0$/i\
    \echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release
    " package/kochiya/autoset/files/def_uci/zzz-autoset*

    # 使用通配符匹配所有以 zzz-autoset- 开头的文件并执行 grep
    for file in package/kochiya/autoset/files/def_uci/zzz-autoset-*; do
        grep DISTRIB_DESCRIPTION "$file"
    done
}


function set_firewall_allow() {
sed -i '/^	commit$/i\
	set firewall.@zone[1].input="ACCEPT"
' package/kochiya/autoset/files/def_uci/zzz-autoset*
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
    "feeds/lunatic7/rtl8821cu"
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
    "smartdns"
    "luci-app-smartdns"
)

for package in "${packages[@]}"; do
        echo "卸载软件包 $package ..."
        ./scripts/feeds uninstall $package
        echo "软件包 $package 已卸载。"
done

directories=(
    "feeds/luci/applications/luci-app-dockerman"
    "feeds/luci/applications/luci-app-smartdns"
    "feeds/lunatic7/rtl8821cu"
    "feeds/packages/net/xray-core"
    "feeds/packages/net/smartdns"
    "feeds/lunatic7/dae"
    "feeds/lunatic7/daed"
    "feeds/lunatic7/daed-next"
    "feeds/lunatic7/luci-app-apinger"
    "feeds/lunatic7/luci-app-daed"
    "feeds/lunatic7/luci-app-daed-next"
    "feeds/lunatic7/dufs"
    "feeds/lunatic7/luci-app-dufs"
    "feeds/lunatic7/pcat-manager"
    "feeds/lunatic7/rustdesk-server"
    "feeds/lunatic7/shadowsocks-rust"
    "feeds/lunatic7/spotifyd"
    "feeds/lunatic7/luci-app-spotifyd"
    "feeds/lunatic7/luci-app-music-remote-center"
    "feeds/lunatic7/tuic-server"
    "feeds/lunatic7/firewall4"
    "feeds/lunatic7/luci-app-lorawan-basicstation"
    "feeds/lunatic7/luci-app-keepalived"
    "feeds/lunatic7/luci-app-rclone"
    "feeds/lunatic7/sing-box"
    "feeds/lunatic7/luci-app-passwall2"
    "feeds/lunatic7/ntfs3-mount"
    "feeds/lunatic7/automount"
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
function patch_openwrt_2102() {
        for i in $( ls mypatch-2102 ); do
            echo Applying mypatch-2102 $i
            patch -p1 --no-backup-if-mismatch --quiet < mypatch-2102/$i
        done
        }
function patch_package() {
        for packagepatch in $( ls feeds/packages/feeds-package-patch-2102 ); do
            cd feeds/packages/
            echo Applying feeds-package-patch-2102 $packagepatch
            patch -p1 --no-backup-if-mismatch < feeds-package-patch-2102/$packagepatch
            cd ../..
        done
        }
function patch_luci() {
        for lucipatch in $( ls feeds/luci/luci-patch-2102 ); do
            cd feeds/luci/
            echo Applying luci-patch-2102 $lucipatch
            patch -p1 --no-backup-if-mismatch < luci-patch-2102/$lucipatch
            cd ../..
        done
        }
function patch_lunatic7() {
        for lunatic7patch in $( ls feeds/lunatic7/lunatic7-revert ); do
            cd feeds/lunatic7/
            echo Revert lunatic7 $lunatic7patch
            patch -p1 -R --no-backup-if-mismatch < lunatic7-revert/$lunatic7patch
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
echo "$(cat package-configs/ath79-nand-2102-common-iptables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_ath79_2102_packages() {
echo "$(cat package-configs/ath79-2102-common-iptables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_ramips_mt7620_2102_packages() {
echo "$(cat package-configs/ramips-mt7620-2102-common-iptables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}


if [ "$1" == "ws1508-istore" ]; then
autosetver
remove_error_package
patch_openwrt
patch_package
patch_luci
patch_lunatic7
add_full_istore_luci_for_ws1508
elif [ "$1" == "ath79-nand-2102" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_ath79_nand_2102_packages
elif [ "$1" == "ath79-2102" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_ath79_2102_packages
elif [ "$1" == "ramips-mt7620-2102" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_ramips_mt7620_2102_packages
elif [ "$1" == "patch-openwrt" ]; then
patch_openwrt_2102
patch_openwrt
elif [ "$1" == "firewallremove" ]; then
remove_firewall
elif [ "$1" == "firewall-allow-wan" ]; then
set_firewall_allow
elif [ "$1" == "setver" ]; then
autosetver
else
echo "Invalid argument"
fi
