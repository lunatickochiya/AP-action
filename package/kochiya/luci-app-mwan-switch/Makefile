include $(TOPDIR)/rules.mk

# Keep the installed package identity identical to the standard edition even
# though this source directory has a variant suffix.  Both editions install the
# same paths and must be selected as alternatives, never installed together.
LUCI_NAME:=luci-app-mwan-switch
PKG_NAME:=luci-app-mwan-switch
PKG_RELEASE:=24

LUCI_TITLE:=LAN端口切换
# Do not force either firewall backend. Managed sections use UCI, while the
# return-path helper selects the installed firewall3 or firewall4 runtime.
LUCI_DEPENDS:=+luci-base +rpcd +uci
LUCI_PKGARCH:=all

PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=Router-mwan

define Package/luci-app-mwan-switch/conffiles
/etc/config/mwan-switch
endef

define Build/Prepare/luci-app-mwan-switch
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/init.d/mwan-switch
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/init.d/mwan-switch-monitor
	chmod 0755 $(PKG_BUILD_DIR)/root/usr/libexec/mwan-switch
	chmod 0755 $(PKG_BUILD_DIR)/root/usr/libexec/mwan-switch-return-path
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/uci-defaults/40_luci-app-mwan-switch
endef

define Package/luci-app-mwan-switch/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	chmod 0755 /etc/init.d/mwan-switch /etc/init.d/mwan-switch-monitor /usr/libexec/mwan-switch /usr/libexec/mwan-switch-return-path /etc/uci-defaults/40_luci-app-mwan-switch
	/etc/uci-defaults/40_luci-app-mwan-switch && rm -f /etc/uci-defaults/40_luci-app-mwan-switch
	/etc/init.d/rpcd reload 2>/dev/null
}
exit 0
endef

define Package/luci-app-mwan-switch/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/mwan-switch-monitor stop 2>/dev/null
	/etc/init.d/mwan-switch-monitor disable 2>/dev/null
	/etc/init.d/mwan-switch disable 2>/dev/null
}
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
