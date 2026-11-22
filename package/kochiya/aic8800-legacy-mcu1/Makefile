# SPDX-License-Identifier: GPL-2.0-only
#
# AIC8800 USB Wi-Fi driver, legacy MCU revision 1 branch
# (AIC8800D80/D81 and AIC8800DC/DW devices reporting chip_mcu_id=1)
#
# The "legacy-mcu1" branch ships its own driver and matched V3/V5 firmware.
# It uses the same module names and /lib/firmware layout as the regular
# aic8800 package, so the two variants conflict and only one may be
# installed at a time.
#
# See ../aic8800/Makefile for the "main" branch variant.
#
include $(TOPDIR)/rules.mk

PKG_NAME:=aic8800-legacy-mcu1
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/shenmintao/aic8800d80.git
PKG_SOURCE_DATE:=2026-11-13
PKG_SOURCE_VERSION:=630f4eb2d47b23a933cc4f1be7799b210decc5f0
PKG_MIRROR_HASH:=3bf1ab8996300635429b681b4b6f58f0f2ed9eb090438addd65409b22ca09345

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

define KernelPackage/aic8800-legacy-mcu1
  SUBMENU:=Wireless Drivers
  TITLE:=AIC8800 USB Wi-Fi driver (legacy MCU rev 1)
  URL:=https://github.com/shenmintao/aic8800d80
  DEPENDS:=+kmod-cfg80211 +kmod-usb-core +aic8800-legacy-mcu1-firmware +aic8800-usb-modeswitch +@DRIVER_11AX_SUPPORT
  CONFLICTS:=kmod-aic8800 aic8800-firmware
  FILES:=\
	$(PKG_BUILD_DIR)/drivers/aic8800/aic_load_fw/aic_load_fw.ko \
	$(PKG_BUILD_DIR)/drivers/aic8800/aic8800_fdrv/aic8800_fdrv.ko \
	$(PKG_BUILD_DIR)/drivers/aic8800/aic_zlp_quirk/aic_zlp_quirk.ko
  AUTOLOAD:=$(call AutoProbe,aic_load_fw aic8800_fdrv aic_zlp_quirk)
endef

define KernelPackage/aic8800-legacy-mcu1/description
 Kernel modules for AIC8800 based USB Wi-Fi adapters reporting
 chip_id=7, chip_mcu_id=1 (for example AIC8800D80 or AIC8800DC/DW
 devices affected by the legacy firmware upload timeout).  Uses the
 upstream legacy-mcu1 branch and its matched firmware set.  Not
 compatible with the regular aic8800 package.
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

define Package/aic8800-legacy-mcu1-firmware
  SECTION:=firmware
  CATEGORY:=Firmware
  TITLE:=AIC8800 legacy MCU rev 1 firmware
  URL:=https://github.com/shenmintao/aic8800d80
  PKGARCH:=all
  CONFLICTS:=aic8800-firmware
endef

define Package/aic8800-legacy-mcu1-firmware/description
 Matched firmware for AIC8800 based USB Wi-Fi adapters reporting
 chip_mcu_id=1.  Installs the legacy-mcu1 firmware sets for all
 supported chip variants under /lib/firmware.  Not compatible with the
 regular aic8800-firmware package.
endef

define Package/aic8800-legacy-mcu1-firmware/install
	$(INSTALL_DIR) $(1)/lib/firmware
	$(CP) $(PKG_BUILD_DIR)/fw/aic8800* $(1)/lib/firmware/
endef

$(eval $(call KernelPackage,aic8800-legacy-mcu1))
$(eval $(call BuildPackage,aic8800-legacy-mcu1-firmware))
