#!/bin/bash
#=================================================
# this script is from https://github.com/lunatickochiya/Lunatic-s805-rockchip-Action
# Written By lunatickochiya
# QQ group :286754582  https://jq.qq.com/?_wv=1027&k=5QgVYsC
#=================================================
function init_pkg_env() {
sudo rm -rf /etc/apt/sources.list.d/* /usr/share/dotnet /usr/local/lib/android /opt/ghc
sudo -E apt-get -qq update
sudo -E apt-get -qq install build-essential clang flex g++ gawk gcc-multilib gettext \
git libncurses5-dev libssl-dev python3-distutils python3-pyelftools python3-setuptools \
libpython3-dev rsync unzip zlib1g-dev swig aria2 jq subversion qemu-utils ccache rename \
libelf-dev device-tree-compiler libgnutls28-dev coccinelle libgmp3-dev libmpc-dev libfuse-dev b43-fwcutter cups-ppdc
sudo -E apt-get -qq purge azure-cli ghc* zulu* llvm* firefox powershell openjdk* dotnet* google* mysql* php* android*
sudo -E apt-get -qq autoremove --purge
sudo -E apt-get -qq clean
sudo timedatectl set-timezone "$TZ"
sudo mkdir -p /workdir
sudo chown $USER:$GROUPS /workdir
}

function init_gh_env() {
echo "date=$(date +'%m/%d_%Y_%H/%M')" >> $GITHUB_ENV
echo "date2=$(date +'%Y/%m %d')" >> $GITHUB_ENV
echo "date3=$(date +'%m.%d')" >> $GITHUB_ENV
VERSION="$(echo "${{github.event.action}}" | grep -Eo " [0-9.]+" | sed -e 's/ //')" || true
[ "$VERSION" ] && echo "VERSION=$VERSION" >> $GITHUB_ENV || echo "VERSION=$(date +'%m.%d')" >> $GITHUB_ENV

source "${GITHUB_WORKSPACE}/env/common.txt"
source "${GITHUB_WORKSPACE}/env/openwrt-24.10.repo"
echo "REPO_URL=${REPO_URL}" >> $GITHUB_ENV
echo "BURN_UBOOT_IMG_URL=${BURN_UBOOT_IMG_URL}" >> $GITHUB_ENV
echo "AMLIMG_TOOL_URL=${AMLIMG_TOOL_URL}" >> $GITHUB_ENV
echo "REPO_BRANCH=${REPO_BRANCH}" >> $GITHUB_ENV
echo "DIY_SH=${DIY_SH}" >> $GITHUB_ENV
echo "DIY_SH_AFB=${DIY_SH_AFB}" >> $GITHUB_ENV
echo "DIY_SH_RFC=${DIY_SH_RFC}" >> $GITHUB_ENV
echo "UPLOAD_BIN_DIR=${UPLOAD_BIN_DIR}" >> $GITHUB_ENV
echo "UPLOAD_IPK_DIR=${UPLOAD_IPK_DIR}" >> $GITHUB_ENV
echo "UPLOAD_FIRMWARE=${UPLOAD_FIRMWARE}" >> $GITHUB_ENV
echo "UPLOAD_COWTRANSFER=${UPLOAD_COWTRANSFER}" >> $GITHUB_ENV
echo "UPLOAD_WETRANSFER=${UPLOAD_WETRANSFER}" >> $GITHUB_ENV
echo "UPLOAD_ALLKMOD=${UPLOAD_ALLKMOD}" >> $GITHUB_ENV
echo "UPLOAD_SYSUPGRADE=${UPLOAD_SYSUPGRADE}" >> $GITHUB_ENV
echo "USE_Cache=${USE_Cache}" >> $GITHUB_ENV
#if [ ${{github.event.inputs.TEST-KERNEL}} = true ]; then
#echo "Kernel_Test=_Kernel_Test_Ver" >> $GITHUB_ENV
#fi

echo -e "OPENSSL_3_5=$(echo $PATCH_JSON_INPUT | jq -r ".OPENSSL_3_5")" >> $GITHUB_ENV
echo -e "BCM_FULLCONE=$(echo $PATCH_JSON_INPUT | jq -r ".BCM_FULLCONE")" >> $GITHUB_ENV
echo -e "TRY_BBR_V3=$(echo $PATCH_JSON_INPUT | jq -r ".TRY_BBR_V3")" >> $GITHUB_ENV
echo -e "Firewall_Allow_WAN=$(echo $PATCH_JSON_INPUT | jq -r ".Firewall_Allow_WAN")" >> $GITHUB_ENV
echo -e "DOCKER_BUILDIN=$(echo $PATCH_JSON_INPUT | jq -r ".DOCKER_BUILDIN")" >> $GITHUB_ENV
echo -e "ADD_IB=$(echo $PATCH_JSON_INPUT | jq -r ".ADD_IB")" >> $GITHUB_ENV
echo -e "ADD_SDK=$(echo $PATCH_JSON_INPUT | jq -r ".ADD_SDK")" >> $GITHUB_ENV
echo -e "MAC80211_616=$(echo $PATCH_JSON_INPUT | jq -r ".MAC80211_616")" >> $GITHUB_ENV
echo -e "TEST_KERNEL=$(echo $PATCH_JSON_INPUT | jq -r ".TEST_KERNEL")" >> $GITHUB_ENV

echo -e "Cache=$(echo $CONFIG_JSON_INPUT | jq -r ".Cache")" >> $GITHUB_ENV
echo -e "UPLOAD_RELEASE=$(echo $CONFIG_JSON_INPUT | jq -r ".UPLOAD_RELEASE")" >> $GITHUB_ENV
echo -e "ALLKMOD=$(echo $CONFIG_JSON_INPUT | jq -r ".ALLKMOD")" >> $GITHUB_ENV

chmod +x $DIY_SH $DIY_SH_AFB $DIY_SH_RFC
echo "The target is: $TARGET"
echo "The MATH target is: $TARGET_MACH"
}


function init_math_config() {
  if [ "$TARGET" == 'mt798x-nftables' ] || [ "$TARGET" == 'mt798x-nousb-nftables' ] || [ "$TARGET" == 'ramips-nftables' ] || [ "$TARGET" == 'ath79-nftables' ] || [ "$TARGET" == 'ipq-nftables' ]; then
    bash $GITHUB_WORKSPACE/add-test-packages.sh nft
    echo "----$TARGET-----NFT-test---"
  fi
  if [ "$TARGET" == 'mt798x-iptables' ] || [ "$TARGET" == 'mt798x-nousb-iptables' ] || [ "$TARGET" == 'ramips-iptables' ] || [ "$TARGET" == 'ath79-iptables' ] || [ "$TARGET" == 'ipq-iptables' ]; then
    mv -f machine-configs/single/"$TARGET_MACH"-iptables.config machine-configs/"$TARGET".config
    echo "----$TARGET-----IPT-Machine--------"
  elif [ "$TARGET" == 'mt798x-nftables' ] || [ "$TARGET" == 'mt798x-nousb-nftables' ] || [ "$TARGET" == 'ramips-nftables' ] || [ "$TARGET" == 'ath79-nftables' ] || [ "$TARGET" == 'ipq-nftables' ]; then
    mv -f machine-configs/single/"$TARGET_MACH"-nftables.config machine-configs/"$TARGET".config
    echo "----$TARGET-----NFT-Machine--------"
  fi
}

function init_openwrt_pkg_config() {
  if [ "$TARGET" == 'mt798x-iptables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-iptables.config package-configs/mt798x-common-iptables.config
    echo "----$TARGET-----IPT-Package-Config----"
  elif [ "$TARGET" == 'mt798x-nftables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-nftables.config package-configs/mt798x-common-nftables.config
    echo "----$TARGET-----NFT-Package-Config----"
  elif [ "$TARGET" == 'mt798x-nousb-nftables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-nftables.config package-configs/mt798x-nousb-nftables.config
    echo "----$TARGET-----NFT-Package-Config----"
  elif [ "$TARGET" == 'mt798x-nousb-iptables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-iptables.config package-configs/mt798x-nousb-iptables.config
    echo "----$TARGET-----IPT-Package-Config----"
  elif [ "$TARGET" == 'ramips-iptables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-iptables.config package-configs/ramips-common-iptables.config
    echo "----$TARGET-----IPT-Package-Config----"
  elif [ "$TARGET" == 'ramips-nftables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-nftables.config package-configs/ramips-common-nftables.config
    echo "----$TARGET-----NFT-Package-Config----"
  elif [ "$TARGET" == 'ath79-iptables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-iptables.config package-configs/ath79-common-iptables.config
    echo "----$TARGET-----IPT-Package-Config----"
  elif [ "$TARGET" == 'ath79-nftables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-nftables.config package-configs/ath79-common-nftables.config
    echo "----$TARGET-----NFT-Package-Config----"
  elif [ "$TARGET" == 'ipq-iptables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-iptables.config package-configs/ipq-common-iptables.config
    echo "----$TARGET-----IPT-Package-Config----"
  elif [ "$TARGET" == 'ipq-nftables' ]; then
    mv -f package-configs/single/"$TARGET_MACH"-nftables.config package-configs/ipq-common-nftables.config
    echo "----$TARGET-----NFT-Package-Config----"
  fi
}




function init_openwrt_patch() {

if [ "$Firewall_Allow_WAN" = "1" ]; then
    $GITHUB_WORKSPACE/$DIY_SH firewall-allow-wan
    echo "----$TARGET----wan-allow---"
    echo "WAN_NAME=_WAN_ALLOW" >> $GITHUB_ENV
fi

if [ "$TRY_BBR_V3" = "1" ]; then
    [ -d openwrt-2410/mypatch-bbr-v3 ] && cp -r openwrt-2410/mypatch-bbr-v3/* openwrt-2410/mypatch-2410-$TARGET
    echo "----$TARGET----bbr-v3---"
    echo "TRY_BBR_V3_NAME=_BBR_V3" >> $GITHUB_ENV
fi

if [ "$OPENSSL_3_5" = "1" ]; then
    [ -d openwrt-2410/openssl-bump ] && cp -r openwrt-2410/openssl-bump/* openwrt-2410/mypatch-2410-$TARGET
    echo "----$TARGET----openssl-3-5---"
    echo "OPENSSL_3_5_NAME=_OPENSSL_3_5" >> $GITHUB_ENV
fi

if [ "$MAC80211_616" = "1" ]; then
    [ -d openwrt-2410/mac80211-616 ] && cp -r openwrt-2410/mac80211-616/* openwrt-2410/mypatch-2410-$TARGET
    rm -rf openwrt/package/kernel/mt76/patches/100-api_compat.patch
    echo "----$TARGET----mac80211-6-16---"
    echo "MAC80211_616_NAME=_MAC80211_616" >> $GITHUB_ENV
fi

if [ "$AG71XX_FIX" = "1" ]; then
    [ -d openwrt-2410/my-patch-ag71xx-fix ] && cp -r openwrt-2410/my-patch-ag71xx-fix/* openwrt-2410/mypatch-2410-$TARGET
fi

if [ "$BCM_FULLCONE" = "1" ] && [[ "$TARGET" == *-iptables ]]; then
    [ -d openwrt-2410/bcmfullcone ] && cp -r openwrt-2410/bcmfullcone/a-* openwrt-2410/mypatch-2410-$TARGET
    rm -rf openwrt-2410/luci-patch-2410/0004-Revert-luci-app-firewall-add-fullcone.patch
    echo "----$TARGET-----ipt-bcm---"
    echo "BCM_FULLCONE_NAME=_BCM_FULLCONE" >> $GITHUB_ENV
fi

if [ "$BCM_FULLCONE" = "1" ] && [[ "$TARGET" == *-nftables ]]; then
    [ -d openwrt-2410/bcmfullcone ] && cp -r openwrt-2410/bcmfullcone/b-* openwrt-2410/mypatch-2410-$TARGET
    rm -rf openwrt-2410/luci-patch-2410/0004-Revert-luci-app-firewall-add-fullcone.patch
    echo "----$TARGET-----nft-bcm---"
    echo "BCM_FULLCONE_NAME=_BCM_FULLCONE" >> $GITHUB_ENV
fi

if [ "$DOCKER_BUILDIN" = "1" ]; then
    bash $GITHUB_WORKSPACE/add-sfe-packages.sh ipq-docker
    echo "----$TARGET-----Docker--Config--Added--"
    echo "DOCKER_NAME=_DOCKER" >> $GITHUB_ENV
fi

if [ "$ADD_SDK" = "1" ]; then
    bash $GITHUB_WORKSPACE/add-sfe-packages.sh lunatic-lede-sdk
    echo "----$TARGET----SDK---"
fi

if [ "$ADD_IB" = "1" ]; then
    bash $GITHUB_WORKSPACE/add-sfe-packages.sh lunatic-lede-ib
    echo "----$TARGET----IB---"
fi

if [ "$TEST_KERNEL" = "1" ]; then
    [ -d openwrt-2410/core-6-12 ] && cp -r openwrt-2410/core-6-12/* openwrt-2410/mypatch-2410-$TARGET
    rm -rf openwrt/package/kernel/mt76/patches/100-api_compat.patch
    echo "----$TARGET----TEST-KERNEL---"
fi

}


if [ "$1" == "init-pkg-env" ]; then
init_pkg_env
elif [ "$1" == "init-gh-env" ]; then
init_gh_env
elif [ "$1" == "init-math-config" ]; then
init_math_config
elif [ "$1" == "init-openwrt-pkg-config" ]; then
init_openwrt_pkg_config
elif [ "$1" == "init-openwrt-patch" ]; then
init_openwrt_patch
else
echo "Invalid argument"
fi
