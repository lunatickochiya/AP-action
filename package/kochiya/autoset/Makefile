#
# Copyright (C) 2016-2017 GitHub 
#
# This is free software, licensed under the GNU General Public License v3.
# See /LICENSE for more information.

include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/target.mk

PKG_NAME:=autoset
PKG_VERSION:=4.0
PKG_RELEASE:=15
PKG_LICENSE:=GPLv3
PKG_LICENSE_FILES:=LICENSE

PKG_CONFIG_DEPENDS:= \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_RESIZEFS \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_IPTABLE_LEGACY \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_IPTABLE_NFT \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_FW3 \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_temperature \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_temperature_script \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_temperature_script_mtk \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_filesystem \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_usb_storage \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_oneport \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_rockchip \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_meson \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_ramips \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_ath79 \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_ar71xx \
	CONFIG_PACKAGE_$(PKG_NAME)_INCLUDE_uci_ipq \
	CONFIG_PACKAGE_$(PKG_NAME)_SIDE_ROUTER_rockchip

define Package/autoset/default
  SECTION:=luci
  CATEGORY:=LuCI
  TITLE:=Support Packages for router
  PKGARCH:=all
  MAINTAINER:=lunatickochiya <125438787@qq.com>
endef

define Package/autoset
  $(Package/autoset/default)
  TITLE:=Support Packages for router default
endef

define Build/Compile
endef

define Package/autoset-uci
  $(Package/autoset/default)
  TITLE:=Support Packages for router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-oneport
  $(Package/autoset/default)
  TITLE:=Support Packages for oneport router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-meson
  $(Package/autoset/default)
  TITLE:=Support Packages for meson router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-rockchip
  $(Package/autoset/default)
  TITLE:=Support Packages for rockchip router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-mediatek
  $(Package/autoset/default)
  TITLE:=Support Packages for mediatek arm64 router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-ramips
  $(Package/autoset/default)
  TITLE:=Support Packages for mediatek ramips router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-ath79
  $(Package/autoset/default)
  TITLE:=Support Packages for ath79 router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-ipq
  $(Package/autoset/default)
  TITLE:=Support Packages for ipq router uci
  DEPENDS:=autoset +luci-theme-material +luci +@LUCI_LANG_zh_Hans +luci-compat
  HIDDEN:=1
endef

define Package/autoset-uci-ar71xx
  $(Package/autoset/default)
  TITLE:=Support Packages for ar71xx router uci
  DEPENDS:=autoset +@LUCI_LANG_zh-cn +luci +luci-theme-material +luci-compat
  HIDDEN:=1
endef

define Package/autoset-resize-rootfs-script
  $(Package/autoset/default)
  TITLE:=auto resize rootfs script
  DEPENDS:=autoset
  HIDDEN:=1
endef

#define Package/drop-fw4-nftables
#  $(Package/autoset/default)
#  TITLE:=drop fw4 nftables (null package)
#  DEPENDS:=autoset
#  CONFLICTS:=firewall4 kmod-nft-offload nftables
#  HIDDEN:=1
#endef

define Package/luci-temperature-script
  $(Package/autoset/default)
  TITLE:=luci temperature script
  DEPENDS:=autoset
  HIDDEN:=1
endef

define Package/luci-temperature-script-mtk
  $(Package/autoset/default)
  TITLE:=luci temperature script mtk
  DEPENDS:=autoset
  HIDDEN:=1
endef

define Package/$(PKG_NAME)/config
menu "Configuration"
	depends on PACKAGE_$(PKG_NAME)

config PACKAGE_$(PKG_NAME)_SIDE_ROUTER_rockchip
	bool "Rockchip Side router mode"
	select PACKAGE_$(PKG_NAME)_INCLUDE_uci_rockchip
	default n

config PACKAGE_$(PKG_NAME)_INCLUDE_RESIZEFS
	bool "Auto resize rootfs"
	select PACKAGE_resize2fs
	select PACKAGE_tune2fs
	select PACKAGE_losetup
	select PACKAGE_blkid
	select PACKAGE_e2fsprogs
	select PACKAGE_lsblk
	select PACKAGE_fdisk
	select PACKAGE_cfdisk
	select PACKAGE_mkf2fs
	select PACKAGE_mount-utils
	select PACKAGE_parted
	select PACKAGE_autoset-resize-rootfs-script
	select PACKAGE_kmod-loop
	select PACKAGE_$(PKG_NAME)_INCLUDE_filesystem
	default y if TARGET_meson=y||TARGET_rockchip=y||i386||x86_64

config PACKAGE_$(PKG_NAME)_INCLUDE_IPTABLE_LEGACY
	bool "ADD IPTABLES LEGACY"
	select PACKAGE_iptables
	select PACKAGE_iptables-zz-legacy
	select PACKAGE_ip6tables
	select PACKAGE_ip6tables-zz-legacy
	default n

config PACKAGE_$(PKG_NAME)_INCLUDE_IPTABLE_NFT
	bool "ADD IPTABLES NFT"
	select PACKAGE_ip6tables-nft
	select PACKAGE_iptables-nft
	default n

config PACKAGE_$(PKG_NAME)_INCLUDE_FW3
	bool "ADD FIREWALL3"
	select PACKAGE_firewall
	default n

config PACKAGE_$(PKG_NAME)_INCLUDE_temperature
	bool "Temperature Show utils"
	select PACKAGE_lm-sensors-detect
	select PACKAGE_lm-sensors
	select PACKAGE_htop
	select HTOP_LMSENSORS
	default y if TARGET_meson=y||TARGET_rockchip=y||i386||x86_64

config PACKAGE_$(PKG_NAME)_INCLUDE_temperature_script
	bool "Temperature Show script"
	select PACKAGE_luci-temperature-script
	default y if TARGET_meson=y||TARGET_rockchip=y||i386||x86_64

config PACKAGE_$(PKG_NAME)_INCLUDE_temperature_script_mtk
	bool "Temperature Show script for mtk"
	select PACKAGE_luci-temperature-script-mtk
	default y if TARGET_mediatek_mt7981=y

config PACKAGE_$(PKG_NAME)_INCLUDE_filesystem
	bool "Kernel filesystem"
	select PACKAGE_kmod-fs-ext4
	select PACKAGE_kmod-fs-btrfs
	select PACKAGE_kmod-fs-exfat
	default n

config PACKAGE_$(PKG_NAME)_INCLUDE_usb_storage
	bool "Kernel usb2 usb3 storage"
	select PACKAGE_kmod-usb2
	select PACKAGE_block-mount
	select PACKAGE_kmod-usb3
	select PACKAGE_kmod-usb-storage
	select PACKAGE_kmod-usb-storage-extras
	select PACKAGE_kmod-ata-ahci
	select PACKAGE_kmod-usb-storage-uas
	select PACKAGE_kmod-nvme
	select PACKAGE_$(PKG_NAME)_INCLUDE_filesystem
	default n

choice
	prompt "Select UCI Script"
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_meson if TARGET_meson=y
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_rockchip if TARGET_rockchip=y
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_mediatek if TARGET_mediatek=y
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_ramips if TARGET_ramips=y
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_ath79 if TARGET_ath79=y
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_ipq if TARGET_qualcommax=y
	default PACKAGE_$(PKG_NAME)_INCLUDE_uci_ar71xx if TARGET_ar71xx=y

config PACKAGE_$(PKG_NAME)_INCLUDE_uci
	bool "Common UCI"
	select PACKAGE_autoset-uci

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_oneport
	bool "Oneport"
	select PACKAGE_autoset-uci-oneport

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_rockchip
	bool "Rockchip"
	select PACKAGE_autoset-uci-rockchip

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_meson
	bool "Meson"
	select PACKAGE_autoset-uci-meson

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_mediatek
	bool "Mediatek"
	select PACKAGE_autoset-uci-mediatek

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_ramips
	bool "Mediatek Ramips"
	select PACKAGE_autoset-uci-ramips

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_ath79
	bool "ATH79 SUPPORT"
	select PACKAGE_autoset-uci-ath79

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_ipq
	bool "IPQ SUPPORT"
	select PACKAGE_autoset-uci-ipq

config PACKAGE_$(PKG_NAME)_INCLUDE_uci_ar71xx
	bool "IPQ SUPPORT"
	select PACKAGE_autoset-uci-ar71xx

endchoice

choice
	prompt "Select ntfs filesystem"
	depends on PACKAGE_$(PKG_NAME)_INCLUDE_filesystem
	default PACKAGE_$(PKG_NAME)_INCLUDE_ntfs

config PACKAGE_$(PKG_NAME)_INCLUDE_ntfs
	bool "NTFS KERNEL"
	select PACKAGE_kmod-fs-ntfs3

config PACKAGE_$(PKG_NAME)_INCLUDE_ntfs_oot
	bool "NTFS OOT"
	select PACKAGE_kmod-fs-ntfs3-oot
	select PACKAGE_ntfs3-mount
	select PACKAGE_ntfsprogs

endchoice

endmenu
endef

define Package/autoset/install
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(CP) ./files/luci-mod-status-autoset.json $(1)/usr/share/rpcd/acl.d/
endef

define Package/autoset-uci-rockchip/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(if $(CONFIG_PACKAGE_autoset_SIDE_ROUTER_rockchip), \
		$(INSTALL_BIN) ./files/def_uci/zzz-autoset-rockchip-siderouter $(1)/etc/uci-defaults/zz99-autoset, \
		$(INSTALL_BIN) ./files/def_uci/zzz-autoset-rockchip $(1)/etc/uci-defaults/zz99-autoset \
	)
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-uci-meson/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-meson $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-uci-mediatek/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-mediatek $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-uci-ramips/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-ramips $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-uci-ath79/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-ath79 $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-uci-ar71xx/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-ar71xx $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-uci-ipq/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-ipq $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
	$(INSTALL_DIR) $(1)/sbin
	$(INSTALL_BIN) ./files/arm/usage $(1)/sbin/usage
endef

define Package/autoset-uci/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset $(1)/etc/uci-defaults/zz99-autoset
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless

endef

define Package/autoset-uci-oneport/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/def_uci/zzz-autoset-oneport $(1)/etc/uci-defaults/zz99-autoset-oneport
	$(INSTALL_BIN) ./files/def_uci/998-wireless-set $(1)/etc/uci-defaults/z998-wireless
endef

define Package/autoset-resize-rootfs-script/install
	$(INSTALL_DIR) $(1)/root
	$(INSTALL_BIN) ./files/resize.sh $(1)/root/resize.sh
	$(INSTALL_BIN) ./files/fix-emmc.sh $(1)/root/fix-emmc.sh
endef

define Package/luci-temperature-script/install
	$(INSTALL_DIR) $(1)/sbin
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/cpuinfo $(1)/sbin/
	$(INSTALL_BIN) ./files/tempinfo $(1)/sbin/
	$(INSTALL_BIN) ./files/60-autoset-reload-rpcd $(1)/etc/uci-defaults/
endef

define Package/luci-temperature-script-mtk/install
	$(INSTALL_DIR) $(1)/sbin
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/status/include
	$(INSTALL_BIN) ./files/arm/tempinfo $(1)/sbin/
	$(INSTALL_BIN) ./files/generic/cpuinfo $(1)/sbin/
	$(INSTALL_BIN) ./files/generic/ethinfo $(1)/sbin/
	$(INSTALL_DATA) ./files/generic/21_ethinfo.js $(1)/www/luci-static/resources/view/status/include/
	$(INSTALL_BIN) ./files/60-autoset-reload-rpcd $(1)/etc/uci-defaults/
endef

$(eval $(call BuildPackage,autoset))
$(eval $(call BuildPackage,autoset-uci))
$(eval $(call BuildPackage,autoset-uci-oneport))
$(eval $(call BuildPackage,autoset-uci-rockchip))
$(eval $(call BuildPackage,autoset-uci-mediatek))
$(eval $(call BuildPackage,autoset-uci-ramips))
$(eval $(call BuildPackage,autoset-uci-ath79))
$(eval $(call BuildPackage,autoset-uci-ar71xx))
$(eval $(call BuildPackage,autoset-uci-ipq))
$(eval $(call BuildPackage,autoset-uci-meson))
$(eval $(call BuildPackage,autoset-resize-rootfs-script))
$(eval $(call BuildPackage,luci-temperature-script))
$(eval $(call BuildPackage,luci-temperature-script-mtk))
# $(eval $(call BuildPackage,drop-fw4-nftables))

