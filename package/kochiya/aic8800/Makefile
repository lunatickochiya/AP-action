# SPDX-License-Identifier: GPL-2.0-only
#
# AIC8800 USB Wi-Fi driver (AIC8800D80/D81, D80N, D80X2, DC/DW, DLN)
#
# The driver is built against OpenWrt's mac80211 backports headers, so
# CFG80211_VERSION must describe the backports release and not the kernel
# version.  It is derived from package/kernel/mac80211 below: the driver
# selects cfg80211 callbacks that changed in backports 7.x (wireless_dev
# argument, link_id, probe_client).
#
# The pinned source is the "main" branch of the upstream repository
# (chip_mcu_id=0 or unknown).  Adapters reporting chip_mcu_id=1 require the
# upstream "legacy-mcu1" branch and its matched firmware.
#
include $(TOPDIR)/rules.mk

PKG_NAME:=aic8800
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/shenmintao/aic8800d80.git
PKG_SOURCE_DATE:=2026-11-13
PKG_SOURCE_VERSION:=017c3560cbf3943febc81ca70380ae45ddef469c
PKG_MIRROR_HASH:=6666b6402f8212c052785a8adebb16dfe4eb105c71b7e5aa505ef6598888615f

PKG_MAINTAINER:=lunatickochiya <125438787@qq.com>
PKG_LICENSE:=GPL-2.0-only
PKG_LICENSE_FILES:=LICENSE
PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/kernel.mk
include $(INCLUDE_DIR)/package.mk

# package/kernel/mac80211 uses e.g. "7.2" or "6.18.26" as PKG_SOURCE_VERSION.
# The driver expects a full major.minor.patch version for KERNEL_VERSION().
MAC80211_PKG_VERSION:=$(word 1,$(shell sed -n 's/^PKG_SOURCE_VERSION:=//p' $(TOPDIR)/package/kernel/mac80211/Makefile))
CFG80211_VERSION:=$(MAC80211_PKG_VERSION)$(if $(filter 2,$(words $(subst ., ,$(MAC80211_PKG_VERSION)))),.0)

ifeq ($(CFG80211_VERSION),)
  $(error Unable to read PKG_SOURCE_VERSION from package/kernel/mac80211/Makefile)
endif

STAMP_CONFIGURED_DEPENDS := $(STAGING_DIR)/usr/include/mac80211-backport/backport/autoconf.h

define KernelPackage/aic8800
  SUBMENU:=Wireless Drivers
  TITLE:=AIC8800 USB Wi-Fi driver
  URL:=https://github.com/shenmintao/aic8800d80
  DEPENDS:=+kmod-cfg80211 +kmod-usb-core +aic8800-firmware +aic8800-usb-modeswitch +@DRIVER_11AX_SUPPORT
  FILES:=\
	$(PKG_BUILD_DIR)/drivers/aic8800/aic_load_fw/aic_load_fw.ko \
	$(PKG_BUILD_DIR)/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.ko \
	$(PKG_BUILD_DIR)/drivers/aic8800/aic_zlp_quirk/aic_zlp_quirk.ko
  AUTOLOAD:=$(call AutoProbe,aic_load_fw aic8800_fdrv aic_zlp_quirk)
endef

define KernelPackage/aic8800/description
 Kernel modules for AIC8800 based USB Wi-Fi adapters such as the Tenda U11
 and AX913B.  Supports the AIC8800D80/D81, D80N, D80X2, DC/DW and DLN chip
 variants, including combo adapters which use the standard btusb driver for
 Bluetooth.
endef

NOSTDINC_FLAGS := \
	$(KERNEL_NOSTDINC_FLAGS) \
	-I$(STAGING_DIR)/usr/include/mac80211-backport/uapi \
	-I$(STAGING_DIR)/usr/include/mac80211-backport \
	-I$(STAGING_DIR)/usr/include/mac80211/uapi \
	-I$(STAGING_DIR)/usr/include/mac80211 \
	-include backport/backport.h

PKG_EXTMOD_SUBDIRS:=drivers/aic8800

# Build with request_firmware() instead of the vendor's filp_open() reader:
# the latter relies on __getname()/__putname(), which are not exported to
# modules on current kernels.  request_firmware() also matches how OpenWrt
# ships firmware below /lib/firmware.
define Build/Compile
	+$(KERNEL_MAKE) $(PKG_JOBS) \
		M="$(PKG_BUILD_DIR)/drivers/aic8800" \
		NOSTDINC_FLAGS="$(NOSTDINC_FLAGS)" \
		CFG80211_VERSION="$(CFG80211_VERSION)" \
		CONFIG_USE_FW_REQUEST=y \
		modules
endef

define Package/aic8800-firmware
  SECTION:=firmware
  CATEGORY:=Firmware
  TITLE:=AIC8800 Wi-Fi/Bluetooth firmware
  URL:=https://github.com/shenmintao/aic8800d80
  PKGARCH:=all
endef

define Package/aic8800-firmware/description
 Firmware for AIC8800 based USB Wi-Fi adapters.  Installs the matched
 firmware sets for all supported chip variants under /lib/firmware.
endef

define Package/aic8800-firmware/install
	$(INSTALL_DIR) $(1)/lib/firmware
	$(CP) $(PKG_BUILD_DIR)/fw/aic8800* $(1)/lib/firmware/
endef

# Some AIC8800D80 adapters (Pandora 88M80 clones) first enumerate as
# 1111:1111 mass storage and have to be switched to a69c:8d80.  The
# usb-modeswitch package provides /sbin/usbmode.
define Package/aic8800-usb-modeswitch
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=AIC8800 1111:1111 USB mode switch helper
  URL:=https://github.com/shenmintao/aic8800d80
  PKGARCH:=all
  DEPENDS:=+usb-modeswitch
endef

define Package/aic8800-usb-modeswitch/description
 Hotplug helpers for AIC8800 based USB Wi-Fi adapters.  The usb hotplug
 switches AIC8800D80 "Pandora 88M80" adapters from the 1111:1111
 mass-storage mode to the a69c:8d80 Wi-Fi/Bluetooth mode; the USB product
 string is checked before sending the vendor commands, so unrelated
 1111:1111 devices are left alone.  The ieee80211 hotplug enables the
 adapter's untouched default AP section and rebinds the radio when the
 driver registers the phy, so plugging the adapter in brings the network
 up without manual configuration.
endef

define Package/aic8800-usb-modeswitch/install
	$(INSTALL_DIR) $(1)/etc/hotplug.d/usb $(1)/etc/hotplug.d/ieee80211
	$(INSTALL_BIN) ./files/aic8800-modeswitch.hotplug $(1)/etc/hotplug.d/usb/25-aic8800-modeswitch
	$(INSTALL_BIN) ./files/aic8800-radio.hotplug $(1)/etc/hotplug.d/ieee80211/30-aic8800-radio
endef

$(eval $(call KernelPackage,aic8800))
$(eval $(call BuildPackage,aic8800-firmware))
$(eval $(call BuildPackage,aic8800-usb-modeswitch))
