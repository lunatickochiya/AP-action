#!/bin/bash
#=================================================
# this script is from https://github.com/lunatickochiya/Lunatic-s805-rockchip-Action
# Written By lunatickochiya
# QQ group :286754582  https://jq.qq.com/?_wv=1027&k=5QgVYsC
#=================================================

autosetver() {
version=23.05
sed -i "52i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-meson
sed -i "58i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-mediatek
sed -i "51i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-ramips
sed -i "51i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-ath79
sed -i "52i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-rockchip
sed -i "51i\echo \"DISTRIB_DESCRIPTION='OpenWrt $version Compiled by 2U4U'\" >> /etc/openwrt_release" package/kochiya/autoset/files/zzz-autoset-rockchip-siderouter

grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-mediatek
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-meson
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-rockchip
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-ramips
grep DISTRIB_DESCRIPTION package/kochiya/autoset/files/zzz-autoset-ath79
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

function patch_openwrt_2305() {
        for i in $( ls mypatch-2305 ); do
            echo Applying mypatch-2305 $i
            patch -p1 --no-backup-if-mismatch < mypatch-2305/$i
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
function patch_lunatic7() {
        for lunatic7patch in $( ls feeds/lunatic7/lunatic7-revert ); do
            cd feeds/lunatic7/
            echo Revert lunatic7 $lunatic7patch
            patch -p1 -R --no-backup-if-mismatch < lunatic7-revert/$lunatic7patch
            cd ../..
        done
        }

function patch_kernel61() {
for rockpatch in $( ls tpm312/openwrt-23.05-k6.1/core ); do
    echo Applying openwrt-23.05-k6.1 $rockpatch
    patch -p1 --no-backup-if-mismatch < tpm312/openwrt-23.05-k6.1/core/$rockpatch
done

directories2=(
    "package/kernel/mac80211"
    "package/kernel/mt76"
)

for directory2 in "${directories2[@]}"; do
    if [ -d "$directory2" ]; then
        echo "目录 $directory2 存在，进行删除操作..."
        rm -r "$directory2"
        echo "目录 $directory2 已删除。"
    else
        echo "目录 $directory2 不存在。"
    fi
done

source_directory="tpm312/package/kernel/mac80211"
source_directory2="tpm312/package/kernel/mt76"
target_directory="package/kernel/mac80211"
target_directory2="package/kernel/mt76"

# 检查源目录1是否存在
if [ -d "$source_directory" ]; then
    echo "源目录 $source_directory 存在。"

    # 检查目标目录1是否存在
    if [ -d "$target_directory" ]; then
        echo "目标目录 $target_directory 已经存在，无需移动。"
    else
        echo "目标目录 $target_directory 不存在，进行恢复操作..."
        mv -f "$source_directory" "$target_directory"
        echo "目录 $source_directory 已移动到目标目录 $target_directory。"
    fi
else
    echo "源目录 $source_directory 不存在。"
fi

# 检查源目录2是否存在
if [ -d "$source_directory2" ]; then
    echo "源目录 $source_directory2 存在。"

    # 检查目标目录2是否存在
    if [ -d "$target_directory2" ]; then
        echo "目标目录 $target_directory2 已经存在，无需移动。"
    else
        echo "目标目录 $target_directory2 不存在，进行恢复操作..."
        mv -f "$source_directory2" "$target_directory2"
        echo "目录 $source_directory2 已移动到目标目录 $target_directory2。"
    fi
else
    echo "源目录 $source_directory2 不存在。"
fi

rm -rf tpm312
}

function patch_tele() {
        cd openwrt/feeds/telephony
        for patchfile in tele/*.patch; do
            patch -p1 < "$patchfile"
        done
        cd ../../..
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

function add_ramips_iptables_packages() {
echo "$(cat package-configs/ramips-common-iptables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_ramips_nftables_packages() {
echo "$(cat package-configs/ramips-common-nftables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_mt798x_iptables_packages() {
echo "$(cat package-configs/mt798x-common-iptables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_mt798x_nftables_packages() {
echo "$(cat package-configs/mt798x-common-nftables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_mt798x_nousb_nftables_packages() {
echo "$(cat package-configs/mt798x-no-usb-nftables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_mt798x_nousb_iptables_packages() {
echo "$(cat package-configs/mt798x-no-usb-iptables.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_mt798x_packages() {
echo "$(cat package-configs/mt798x-common.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

function add_mt798x_istore_packages() {
echo "$(cat package-configs/mt798x-common-istore.config)" >> package-configs/.config
mv -f package-configs/.config .config
}

if [ "$1" == "mt798x-iptables" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_mt798x_iptables_packages
elif [ "$1" == "mt798x-nftables" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_mt798x_nftables_packages
elif [ "$1" == "mt798x-nousb-nftables" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_mt798x_nousb_nftables_packages
elif [ "$1" == "mt798x-nousb-iptables" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_mt798x_nousb_iptables_packages
elif [ "$1" == "mt798x-istore" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_mt798x_istore_packages
elif [ "$1" == "ramips-iptables" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_ramips_iptables_packages
elif [ "$1" == "ramips-nftables" ]; then
autosetver
remove_error_package_not_install
patch_package
patch_luci
patch_lunatic7
add_ramips_nftables_packages
elif [ "$1" == "patch-openwrt" ]; then
patch_openwrt_2305
patch_openwrt
elif [ "$1" == "firewallremove" ]; then
remove_firewall
elif [ "$1" == "kernel61" ]; then
patch_kernel61
else
echo "Invalid argument"
fi
